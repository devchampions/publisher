import axios from 'axios'
import eventbrite from './EventbriteApi'

class Checkout {

	constructor(country, currency, email) {
		if (!country) {
			throw `No country provided.`
		}

		if (!currency) {
			throw `No currency provided.`
		}		

		if (!email) {
			throw `No email provided!`
		}		
		this.country = country
		this.currency = currency
		this.email = email
	}

	id() {
		return eventbrite
			.get('/checkout_settings', { params: { country: this.country, currency: this.currency } })
			.then(it => {
		  		let checkouts = it.data.checkout_settings
				if (checkouts.length) {
					console.log(JSON.stringify(checkouts))
					return checkouts.pop().id
				} else {
					return eventbrite
						.post('/checkout_settings/',  {
							checkout_settings: {
								country_code: this.country,
								currency_code: this.currency,
								checkout_method: "paypal",
							},
							paypal_email: this.email
						})
						.then(it => it.data.id)
				}
			})		
	}
}

class CheckoutId {
	constructor(id) {
		this.id = id
	}

	applyTo(eventId) {
		return eventbrite.post(`/events/${eventId}/checkout_settings/`,  { checkout_settings_ids: [id] })
	}
}

export default Checkout
