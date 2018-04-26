import axios from 'axios'
import eventbrite from './EventbriteApi'

class Checkout {

	id() {
		return eventbrite
			.get('/checkout_settings', { params: { country: "EE", currency: "EUR" } })
			.then(it => {
		  		let checkouts = it.data.checkout_settings
				if (checkouts.length) {
					console.log(JSON.stringify(checkouts))
					return checkouts.pop().id
				} else {
					return eventbrite
						.post('/checkout_settings/',  {
							checkout_settings: {
								country_code: "EE",
								currency_code: "EUR",
								checkout_method: "paypal",
							},
							paypal_email: "eduards@sizovs.net"
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

export default new Checkout()