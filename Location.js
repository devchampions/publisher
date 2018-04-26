import geo from 'country-data'
import axios from 'axios'
import eventbrite from './EventbriteApi'

class Location {
	constructor(text) {

		let firebaseStore = process.env.FIREBASE_STORE
		if (!firebaseStore) {
			throw "Please provide FIREBASE_STORE env variable. E.g. http://project.firebaseio.com/store"
		}

		this.firebaseVenues = `${firebaseStore}/venues.json`

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
		this.text = text;
	}

	eventbriteVenue() {
		let url = `${this.firebaseVenues}?orderBy="ext_id"&equalTo="${this.text}"`
		console.log(`Looking for venue ${url}`)
		return axios.get(url)
			.then(it => this.pushToEventbriteOrTakeFromFirebase(it))
			.catch(e => {
				throw `Exception while retrieving venue ${this.text}: ${e}`
			})
	}

	pushToEventbriteOrTakeFromFirebase(e) {
		if (!Object.keys(e.data).length) {
			return this.pushToEventbrite().then(it => this.firebasify(it))
		} else {
			let evt_id = Object.values(e.data).pop().evt_id;
			// console.log(`Eventbrite venue [${evt_id}] located in Firebase`)
			return evt_id;
		}		
	}

	pushToEventbrite() {
		return eventbrite
			.post('/venues/', {
				venue: {
					name: this.text,
					address: { city: this.city, country: this.countryCode }
				}})
			.then(v => {
				let evt_id = v.data.id;
				console.log(`Venue created in Eventbrite ${evt_id} for ${this.text}`)
				return evt_id;
			});
	}

	firebasify(evt_id) {
		return axios.post(this.firebaseVenues, {
			evt_id: evt_id,
			ext_id: this.text
		})
		.then(it => {
			console.log(`Venue created in Firebase ${evt_id}`)
			return evt_id;
		})	
	}

}

export default Location