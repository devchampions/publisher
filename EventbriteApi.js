import axios from 'axios'

class EvenbriteApi {

	constructor(x) {

		this.token = process.env.EVENTBRITE_TOKEN
		if (!token) {
			throw "Please provide EVENTBRITE_TOKEN env variable"
		}

		this.axios = axios.create({
		  baseURL: 'https://www.eventbriteapi.com/v3/',
		  headers: { Authorization: `Bearer ${token}` }
		})		
	} 

	get(uri, config) {
		return new Promise((resolve, reject) => {
			this.axios
				.get(uri, config)
				.then(resolve)
				.catch(e => {
					reject(`${e.response.data.error}: ${e.response.data.error_description}`)
				})
		})
	}

	post(uri, body) {
		return new Promise((resolve, reject) => {
			this.axios
				.post(uri, body)
				.then(resolve)
				.catch(e => {
					reject(`${e.response.data.error}: ${e.response.data.error_description}`)
				})
		})
	}

	delete(uri) {
		return new Promise((resolve, reject) => {
			this.axios
				.delete(uri)
				.then(resolve)
				.catch(e => {
					reject(`${e.response.data.error}: ${e.response.data.error_description}`)
				})
		})
	}	

}

export default new EvenbriteApi()