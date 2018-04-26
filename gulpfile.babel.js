'use strict'

import fs from 'fs'
import line from 'readline'

import hash from 'object-hash'
import gulp from 'gulp'
import axios from 'axios'
import delay from 'delay'
import querystring from 'querystring'
import cheerio from 'cheerio'
import moment from 'moment'
import fetch from 'node-fetch'
import Schedule from './Schedule'
import checkout from './Checkout'
import Promise from 'bluebird'
import eventbrite from './EventbriteApi'

import Event from './Event'
import Ticket from './Ticket'
import Image1 from './EventbriteImage'
import Image2 from './EventbriteImage'
import Image3 from './EventbriteImage'

gulp.task('play', async() => {
	console.log(Image1)
	console.log(Image3)
	console.log(Image3)
})


gulp.task('doWithUserEvents', async() => {

	const low = require('lowdb')
	const FileSync = require('lowdb/adapters/FileSync')
	const adapter = new FileSync('data.db.json')

	const db = low(adapter)
	db.defaults({ events: [] }).write()

	let iterate = (page) => eventbrite.get('/users/244798500761/owned_events/', {
		params: {
			status: 'draft'
		}
	}).then(it => {
		let hasMore = page <= it.data.pagination.page_count
		console.log(`Iterated ${page}. Has more ${hasMore}`)
		it.data.events.forEach(e => {
			if (e.status == "draft") {
				console.log(`Deleging ${e.url} with status ${e.status}`)
				eventbrite.delete(`/events/${e.id}/`)
			}
		})
		if (hasMore) {
			return iterate(page + 1)
		}

	})

	await iterate(1)
})

gulp.task('doSomethingWithPublicEvents', async() => {

	const low = require('lowdb')
	const FileSync = require('lowdb/adapters/FileSync')

	const adapter = new FileSync('data.db.json')
	const db = low(adapter)
	db.defaults({ events: [] }).write()

	let iterate = (page) => eventbrite.get('/events/search/', {
		params: {
			q: 'Java',
			page: page,
			// include_unavailable_events: true,
			'organizer.id': '16811871042'
		}
	}).then(it => {
		let hasMore = page <= it.data.pagination.page_count
		console.log(`Iterated ${page}. Has more ${hasMore}`)
		it.data.events.forEach(e => {
			let regex = /"(https\:\/\/devchampions\.com\/training\/java.*?)"/gm
			let matches = regex.exec(e.description.html)
			// let match = e.name.text.includes("Patterns")
			// if (match) {
				let evt = {
					title: e.name.text,
					url: e.url,
					id: e.id,
					link: matches[1]
				}

				console.log(JSON.stringify(evt))				
				db.get('events')
				  .push(evt)
				  .write()
		})
		if (hasMore) {
			return iterate(page + 1)
		}

	})

	await iterate(1)
})


		// return Promise.all(it.data.events.filter(e => e.name.text.includes("patterns")).map(e => {
		// 	// console.log(e.url)
		// 	// console.log(e.id)
		// 	return axios
		// 			.get(`https://dc-publisher.firebaseio.com/eventbrite/events.json?orderBy="evt_id"&equalTo="${e.id}"`)
		// 			.then(me => {
		// 				console.log(e);
		// 			})
		// }))

gulp.task('default', async () => {

	let checkoutId = await checkout.id()

	let fetchEvent = (url) => {
		console.log(`Fetching event at ${url}`)
		let ticketSales = `<h2>Tickets</h2><br><b>More information and tickets is available <a href="${url}">here</a></b>.<br><br>`
		return fetch(url)
	    	.then(it => it.text())
	    	.then(cheerio.load)
	    	.then($ => [
	    		$("meta[property='og:image']").attr("content"),
	    		$("meta[property='dc:date']").attr("content"),
	    		$("meta[property='dc:price']").map((index, el) =>  new Ticket($(el).attr("content"))).get(),
	    		$("meta[property='dc:location']").attr("content"),
	    		$("meta[property='dc:title']").attr("content"),
	    			$("#description article")
	    			.prepend(ticketSales)
	    			.append($("#trainer .training"))
	    			.append(ticketSales).html()
	    	])
	    	.then(it => {
				console.log(`Fetched ${url}`)	    		
				let [image, date, tickets, location, title, body] = it
				return new Event(
					url,
					title,
					image,
					body,
					location,
					date,
					tickets,
					checkoutId
				)	
	    	})    	
	}

	let workshops = await fetch('https://devchampions.com')
		.then(it => it.text())
		.then(cheerio.load)
		.then($ => $("meta[property='dc:training']")
			.map((index, it) => $(it).attr("content")))

	const low = require('lowdb')
	const FileSync = require('lowdb/adapters/FileSync')
	const adapter = new FileSync('data.db.json')
	const db = low(adapter)


	// true esli nashel
	// false esli net


	console.log(`Total number of workshops: ${workshops.get().length}`)
	let workshopsFiltered = workshops.get()
		.filter(it => it.startsWith("training/java") && !it.includes("mar"))
		.filter(it => !db.get('events').filter(e => e.link == `https://devchampions.com/${it}`).value().length)
	console.log(`Number of workshops after filtering: ${workshopsFiltered.length}`)

	// 373
	workshopsFiltered
					.splice(99, 100)
					.map(it => `https://devchampions.com/${it}`)
					.map(url => fetchEvent(url).then(event => event.republish()))
})