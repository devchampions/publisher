import geo from 'country-data'
import axios from 'axios'
import eventbrite from './EventbriteApi'
import fs from 'fs'
const fsPromises = require('fs').promises

class Location {

	constructor(text) {

		this.firebaseStore = process.env.FIREBASE_STORE
		if (!this.firebaseStore) {
			// console.debug("Local storage will be used since FIREBASE_STORE environment variable is not provided e.g. http://project.firebaseio.com/store.")
		} else {
			this.firebaseVenues = `${firebaseStore}/venues.json`
		}		

    if (text == "online") {
      text = "Riga, Latvia"
    }

		let parts = text.split(",")
		if (parts.length < 2) {
			throw `Invalid location format passed [${text}]. Must be [City, Country]. For example – Riga, Latvia`
		}
		this.city = parts[0].trim()
		this.countryName = parts[1].trim()

		let country = geo.lookup.countries({name: this.countryName}).pop()
		if (!country) {
			throw `Sorry, cannot resolve country code for ${this.countryName}`
		}
		this.countryCode = country.alpha2.replace("UK", "GB")
		console.log(`Country code is ${this.countryCode}`)
    this.text = text
    this.fileId = this.text.replace(/[,\s]+/gi, "_").toLowerCase()
    
	}

	async eventbriteVenue() {
    if (!this.firebaseStore) {
      if (!fs.existsSync('.venues')) {
        fs.mkdirSync('.venues')
      }            
      if (!fs.existsSync(`.venues/${this.fileId}.json`)) {
        return this.saveToEventbrite().then(async evt_id => {
          let data = {
            evt_id: evt_id,
            ext_id: this.text
          }
          await fsPromises.writeFile(`.venues/${this.fileId}.json`, JSON.stringify(data))
          return evt_id
        })
      }
      return fsPromises.readFile(`.venues/${this.fileId}.json`)
        .then(buffer => JSON.parse(buffer).evt_id)
        .catch(e => { throw `Exception while retrieving a venue from local store ${this.fileId}: ${e}` })
    } else {
      return this.existsInFirebase().then(async evt_id => {
        if (!evt_id) {
          return this.saveToEventbrite().then(evt_id => this.saveToFirebase(evt_id))
        } else {
          return Promise.resolve(evt_id)
        }
      })
    }    
	}

	async saveToEventbrite() {
		return eventbrite
			.post('/venues/', {
				venue: {
					name: this.text,
          address: { 
            city: this.city, 
            country: this.countryCode 
          }
        }
      })
      .then(v => {
				let evt_id = v.data.id
				console.log(`Venue created in Eventbrite ${evt_id} for ${this.text}`)
				return evt_id
			})
  }
  
  async saveToFirebase(evt_id) {
    return axios.post(this.firebaseVenues, {
      evt_id: evt_id,
      ext_id: this.text
    }).then(it => {
      console.log(`Venue created in Firebase ${evt_id}`)
      return evt_id
    })
  }

  async existsInFirebase() {
    let url = `${this.firebaseVenues}?orderBy="ext_id"&equalTo="${this.text}"`
    console.log(`Looking for venue in Firebase: ${url}`)
    return axios.get(url)
      .then(it => {
        if (!Object.keys(e.data).length) {
          return Promise.resolve(null)
        } else {
          let evt_id = Object.values(e.data).pop().evt_id
          console.log(`Eventbrite venue [${evt_id}] located in Firebase`)
          return Promise.resolve(evt_id)
        }		      
      }).catch(e => {
        throw `Exception while retrieving venue ${this.text}: ${e}`
      })

  }

}

export default Location
