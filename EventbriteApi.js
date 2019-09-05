
import axios from 'axios'
import pino from 'pino'
import uuid from 'uuid/v4'

class EventbriteApi {

  constructor(x) {
    this.logger = pino(
      { level: "debug" }, 
      pino.destination('eventbrite.log')
    )
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
    let requestId = uuid()
    this.logger.debug({ id: requestId, uri: uri, body: config }, "GET REQUEST")
    return new Promise((resolve, reject) => {
      this.axios
        .get(uri, config)
        .then(response => {
          this.logger.debug({ id: requestId, uri: uri, body: response.data, headers: response.headers }, "GET RESPONSE")
          return response
        })
        .then(resolve)
        .catch(e => {
          this.logger.debug({ id: requestId, uri: uri, body: e.response.data, headers: e.response.headers }, "GET ERROR")
          reject(`${e.response.data.error}: ${e.response.data.error_description}`)
        })
    })
  }

  post(uri, body) {
    let requestId = uuid()
    this.logger.debug({ id: requestId, uri: uri, body: body }, "POST REQUEST")
    return new Promise((resolve, reject) => {
      this.axios
        .post(uri, body)
        .then(response => {
          this.logger.debug({ id: requestId, uri: uri, body: response.data, headers: response.headers }, "POST RESPONSE")
          return response
        })
        .then(resolve)
        .catch(e => {
          this.logger.debug({ id: requestId, uri: uri, body: e.response.data, headers: e.response.headers }, "POST ERROR")
          reject(`${e.response.data.error}: ${e.response.data.error_description}`)
        })
    })
  }

  delete(uri) {
    let requestId = uuid()
    this.logger.debug({ id: requestId, uri: uri }, "DELETE REQUEST")
    return new Promise((resolve, reject) => {
      this.axios
        .delete(uri)
        .then(response => {
          this.logger.debug({ id: requestId, uri: uri, body: response.data, headers: response.headers }, "DELETE RESPONSE")
          return response
        })
        .then(resolve)
        .catch(e => {
          this.logger.debug({ id: requestId, uri: uri, body: e.response.data, headers: e.response.headers }, "DELETE ERROR")
          reject(`${e.response.data.error}: ${e.response.data.error_description}`)
        })
    })
  }	

}

export default new EventbriteApi()