import Location from './Location'
import Image from './EventbriteImage'
import Schedule from './Schedule'
import Html from './EventbriteHtml'
import Timezone from './Timezone'
import eventbrite from './EventbriteApi'

import axios from 'axios'
import emojiRegex from 'emoji-regex'
import _ from 'lodash'
import * as fs from 'fs'
const fsPromises = require('fs').promises


class Event {

	constructor(url, title, image, body, location, date, tickets, checkoutId) {

		if (!title) {
			throw `No title provided for event ${url}.`
		}

		if (!image) {
			throw `No image provided for event ${url}.`
		}		

		if (!body) {
			throw `No body provided for event ${url}.`
		}

		if (!tickets || !tickets.length) {
			throw `No tickets provided for event ${url}.`
		}

		if (!checkoutId) {
			throw `No checkout id provided for event ${url}.`	
		}

		this.url = url
		this.img = new Image(image)		
		this.tickets = tickets
		this.body = new Html(url, body).toString()
		this.location = new Location(location)
		this.title = `🚀 ${title} (${this.location.city})`
		let timezone = new Timezone(this.location.city).toString()
		this.schedule = new Schedule(date, timezone)
		this.checkoutId = checkoutId

  }

	async republish() {

		let imgId = await this.img.id()
		let venue = await this.location.eventbriteVenue()
		let externalId = new ExternalId(this.url)
		let eventbriteId = await externalId.eventbriteId()
		let isNewEvent = !eventbriteId
		console.log(`${this.url} is new: ${isNewEvent} ${eventbriteId}`)
		
		let [newEventbriteId, live] = await this.exportToEventbrite(venue, imgId, eventbriteId)
		if (isNewEvent) {
			await externalId.mapTo(newEventbriteId)
		}		
    
    await this.setupTickets(newEventbriteId)

		if (!live) {
			await this.publishOnEventbrite(newEventbriteId)
    }
    
	}

	async exportToEventbrite(venue, imgId, id = "") {

		let apiEndpoint = `/events/${id ? id + '/' : id}`
		console.log(`(Re)exporting event ${this.title} ${this.url} (${apiEndpoint})`)
    return eventbrite.post(apiEndpoint, 
      {
        event: {
          name: { html: this.title.replace(emojiRegex(), '') },
          start: {
            timezone: this.schedule.timezone,
            utc: this.schedule.startsOnIso
          },
          end: {
            timezone: this.schedule.timezone,
            utc: this.schedule.endsOnIso
          },				
          currency       : "EUR",
          venue_id       : venue,
          logo_id        : imgId,
          category_id    : 102,      // Science and Technology
          subcategory_id : 2004,     // High Tech
          format_id      : 9,        // Class, Training, or Workshop (1 for Conference)
          show_remaining : false,
          shareable      : true,
          description    : { html: this.body.replace(emojiRegex(), '') }
        }
      })
      .then(it => {
        let eventId = it.data.id
        let isDraft = it.data.status === "draft"
        return [ eventId, !isDraft ]
      })
      .catch(e => { throw `Exception publishing event to Eventbrite ${this.id}: ${e}` })
	}

	async setupTickets(eventId) {

		let ticketsEndpoint = `/events/${eventId}/ticket_classes/`

		return eventbrite.get(ticketsEndpoint)
			.then(async it => {
        let existingTickets = it.data.ticket_classes
        return Promise.all(this.tickets
          .filter(ticket => !ticket.name.toLowerCase().includes('on-premises') )
          .map(ticket => {
            let existingTicket = existingTickets.find(it => 
              it.name.toLowerCase().replace(emojiRegex(), '') == 
                ticket.name.toLowerCase().replace(emojiRegex(), ''))
            _.remove(existingTickets, it => it.resource_uri == existingTicket.resource_uri)
            if (existingTicket) {
              console.log(`Updating ticket: ${ticket.name} at ${existingTicket.resource_uri}`)
              return eventbrite.post(existingTicket.resource_uri, this.ticketData(ticket))
            } else {
              console.log(`Creating ticket: ${ticket.name}`)
              return eventbrite.post(ticketsEndpoint, this.ticketData(ticket))
            }
          })
        ).then(whatever => {
          // Remove any ticket classes that were not defined in master data
          return Promise.all(existingTickets
            .map(existingTicket => {
              console.log(`Deleting obsolete ticket: ${existingTicket.resource_uri}`)
              return eventbrite.delete(existingTicket.resource_uri)
            })
          )
        })
			}).then(it => {
				let url = `/events/${eventId}/checkout_settings/`
				console.log(`Associating checkout ${url} with ${this.checkoutId}`)
				return eventbrite.post(url, { checkout_settings_ids: [ this.checkoutId ] })
			})
	}

  ticketData(ticket) {
    return {
      ticket_class: {
        name: ticket.name.replace(emojiRegex(), ''),
        description: `❗ Before placing an order, please double-check ticket availability with the event organizers by writing to hello@devchampions.com`,
        quantity_total: 20,
        minimum_quantity: ticket.name.includes('3+') ? 3 : 1,
        cost: `EUR,${ticket.price}00`,
        include_fee: true,
        hide_description: false,
        sales_channels: [ "online" ]
      }
    }
  }

	publishOnEventbrite(id) {
		if (!id) {
			throw `Eventbrite publishing failed. ID must be provided`
		}
		let apiEndpoint = `/events/${id}/publish/`
		console.log(`Publishing event ${apiEndpoint}`)
		return eventbrite.post(apiEndpoint)
  }

}

class ExternalId {

	constructor(id) {

		this.firebaseStore = process.env.FIREBASE_STORE
		if (!this.firebaseStore) {
			// console.debug("FIREBASE_STORE env variable is not provided. E.g. http://project.firebaseio.com/store. Local storage will be used.")
		} else {
			this.firebaseEvents = `${firebaseStore}/events.json` 
		}

    this.id = id
    this.fileId = this.id.replace(/https?:\/\//gi, '').replace(/[,\s\/\\]+/gi, '_').toLowerCase()

	}

	async eventbriteId() {
    if (!this.firebaseStore) {
      if (!fs.existsSync(`.events/${this.fileId}.json`)) {
        console.log(`Event file does not exist: .events/${this.fileId}.json`)
        return ""
      } else {
        console.log(`Retrieving event: .events/${this.fileId}.json`)
        return fsPromises.readFile(`.events/${this.fileId}.json`)
          .then(buffer => JSON.parse(buffer).evt_id)
          .catch(e => { throw `Exception while retrieving an event from local store ${this.id}: ${e}` })
      }
    } else {
      return axios.get(`${this.firebaseEvents}?orderBy="ext_id"&equalTo="${this.id}"`)
        .then(it => [it.data]
          .map(Object.values)
          .pop()
          .map(it => it.evt_id)
          .pop())
        .catch(e => { throw `Exception while retrieving an event from Firebase ${this.id}: ${e}` })
    }
	}

	async mapTo(eventbriteId) {
    console.log(`Saving ${eventbriteId} to storage`)
    let data = { evt_id: eventbriteId, ext_id: this.id }
    if (!this.firebaseStore) {
      if (!fs.existsSync('.events')) {
        fs.mkdirSync('.events')
      }      
      return fsPromises.writeFile(`.events/${this.fileId}.json`, JSON.stringify(data)).then(it => eventbriteId)
    } else {
      return axios.post(this.firebaseEvents, data).then(it => eventbriteId)
    }
  }

}

export default Event
