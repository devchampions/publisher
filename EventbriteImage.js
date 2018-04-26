import eventbrite from './EventbriteApi'
import FormData from 'form-data'
import axios, { post } from 'axios'
import rp from 'request-promise'
import request from 'request'
import fs from 'fs'
import {URL} from 'url'

class EventbriteImage {

	constructor(url) {
		this.url = url
		this.fileName = url.substring(url.lastIndexOf('/') + 1)
		if (!this.fileName.endsWith(".png")) {
			throw `Eventbrite only supports PNG images, but was ${url}`
		}
	}	

	id() {
		console.log(`Uploading image ${this.url}`)
		return eventbrite
			.get('/media/upload/?type=image-event-logo')
			.then(it => {
				let instructions = it.data
				return rp({
					method: instructions.upload_method,
					uri: instructions.upload_url,
					formData: Object.assign({}, instructions.upload_data, {
				        file: {
				            value: request(this.url),
				            options: {
				                filename: this.fileName,
				                contentType: 'image/png'
				            }
				        }						
					})
				})
				.then(it => {
					return eventbrite.post('/media/upload/', {
						upload_token: instructions.upload_token,
						crop_mask: {
							top_left: {
								x: 0,
								y: 0
							},
							width: 2160,
							height: 1080
						}
					}).then(it => { 
						let imageId = it.data.id
						return imageId
					})
				})
			})
	}

}

export default EventbriteImage