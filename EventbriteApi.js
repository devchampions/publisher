
import axios from 'axios'

class EvenbriteApi {

	constructor(x) {
		this.token = process.env.EVENTBRITE_TOKEN
		if (!this.token) {
			throw "Please provide EVENTBRITE_TOKEN env variable"
		}
		this.axios = axios.create({
		  baseURL: 'https://www.eventbriteapi.com/v3/',
		  headers: { Authorization: `Bearer ${this.token}` }
		})
		this.scheduleRequests(this.axios, 2000)
	} 

	scheduleRequests(axiosInstance, intervalMs) {
		let lastInvocationTime = undefined
	    
		const scheduler = (config) => {
			const now = Date.now()
			if (lastInvocationTime) {
				lastInvocationTime += intervalMs
				const waitPeriodForThisRequest = lastInvocationTime - now
				if (waitPeriodForThisRequest > 0) {
					return new Promise((resolve) => {
						setTimeout(
							() => resolve(config),
							waitPeriodForThisRequest)
					})
				}
			}		
			lastInvocationTime = now
			return config
		}
	    
		axiosInstance.interceptors.request.use(scheduler)
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