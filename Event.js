import axios from 'axios'
import delay from 'delay'
import marked from 'marked'
import Location from './Location'
import Image from './EventbriteImage'
import Schedule from './Schedule'
import Html from './EventbriteHtml'
import Timezone from './Timezone'
import eventbrite from './EventbriteApi'
import hash from 'object-hash'

class Event {

	constructor(url, title, image, body, location, date, tickets, checkoutId) {

		let firebaseStore = process.env.FIREBASE_STORE
		if (!firebaseStore) {
			throw "Please provide FIREBASE_STORE env variable. E.g. http://project.firebaseio.com/store"
		}

		this.firebaseEvents = `${firebaseStore}/events.json` 

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
		this.title = `❗TOP❗ ${title} (${this.location.city})`
		let timezone = new Timezone(this.location.city).toString()
		this.schedule = new Schedule(date, timezone)
		this.checkoutId = checkoutId
	}

	async republish() {
		let imgId = await this.img.id();
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

	exportToEventbrite(venue, imgId, id = "") {

		let apiEndpoint = `/events/${id ? id + '/' : id}`
		console.log(`(Re)exporting event ${this.title} ${this.url} (${apiEndpoint})`)
		return eventbrite.post(apiEndpoint, {
				event: {
					name: { html: this.title },
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
					description    : { html: this.body }
				}})
				.then(it => {
					let eventId = it.data.id
					let isDraft = it.data.status === "draft"
					return [ eventId, !isDraft ]
				});	
	}

	setupTickets(eventId) {
		let ticketsEndpoint = `/events/${eventId}/ticket_classes/`

		return eventbrite
			.get(ticketsEndpoint)
			.then(it => {
				let ticketsNow = it.data.ticket_classes
				return Promise.all(this.tickets.map(newTicket => {
					let ticketForUpdate = ticketsNow.find(it => it.name == newTicket.name)
					let ep = ticketForUpdate ? ticketForUpdate.resource_uri : ticketsEndpoint
					console.log("Doing stuff with tickets")
					return eventbrite.post(ep, {
							ticket_class: {
								name: newTicket.name,
								description: `❗ Before placing an order, please double-check ticket availability with the event organizers by writing to hello@devchampions.com`,
								quantity_total: 20,
								cost: `EUR,${newTicket.price}00`,
								include_fee: true,
								hide_description: false,
								sales_channels: ["online"]
							}
						}
					)
				}))
			}).then(it => {
				let url = `/events/${eventId}/checkout_settings/`;
				console.log(`Associating checkout ${url} with ${this.checkoutId}`)
				return eventbrite.post(url, { checkout_settings_ids: [this.checkoutId] })
			})
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
		let firebaseStore = process.env.FIREBASE_STORE
		if (!firebaseStore) {
			throw "Please provide FIREBASE_STORE env variable. E.g. http://project.firebaseio.com/store"
		}

		this.firebaseEvents = `${firebaseStore}/events.json` 

		this.id = id
	}
	
	eventbriteId() {
		return axios.get(`${this.firebaseEvents}?orderBy="ext_id"&equalTo="${this.id}"`)
			.then(it => [it.data]
					.map(Object.values)
					.pop()
					.map(it => it.evt_id)
					.pop())
			.catch(e => { throw `Exception while retrieving an event from Firebase ${this.id}: ${e}` })
	}

	mapTo(eventbriteId) {
		console.log("Mapping ids")
		return axios.post(this.firebaseEvents, { evt_id: eventbriteId, ext_id: this.id})
					.then(it => eventbriteId)
	}
}

export default Event
