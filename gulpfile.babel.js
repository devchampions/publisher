'use strict'

import * as gulp from 'gulp'
import * as cheerio from 'cheerio'
import * as fetch from 'node-fetch'

import eventbrite from './EventbriteApi'
import Checkout from './Checkout'
import Event from './Event'
import Ticket from './Ticket'

gulp.task('printOwnedEvents', async() => {

	let iterate = (page) => eventbrite.get('/users/me/owned_events/', {}).then(it => {
		let hasMore = page <= it.data.pagination.page_count
		console.log(`Iterated ${page}. Has more ${hasMore}`)
		it.data.events.forEach(e => {
			console.log(e)
		})
		if (hasMore) {
			return iterate(page + 1)
		}

	})

	await iterate(1)

})


gulp.task('publishEffectiveJava', async () => {

	let checkoutId = await new Checkout('EE', 'EUR', 'eduards@sizovs.net').id()

	let fetchEvent = (url) => {
		console.log(`Fetching event at ${url}`)
		let ticketSales = `<h2>Tickets</h2><br><b>More information and tickets is available <a href="${url}">here</a></b>.<br><br>`
		return fetch(url)
			.then(it => it.text())
			.then(cheerio.load)
			.then($ => [
				$("meta[property='og:image']").attr("content"),
				$("meta[property='dc:date']").attr("content"),
				$("meta[property='dc:price']").map((index, el) => new Ticket($(el).attr("content"))).get(),
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

	console.log(`Total number of workshops: ${workshops.get().length}`)

	let workshopsFiltered = workshops.get()
		.filter(it => it.startsWith("training/java"))
		
	console.log(`Number of workshops after filtering: ${workshopsFiltered.length}`)

	workshopsFiltered
		.splice(0, 1)
		.map(it => `https://devchampions.com/${it}`)
		.map(url => fetchEvent(url).then(event => event.republish()))

})


gulp.task('publishExtremeAutomation', async () => {

	let checkoutId = await new Checkout('LV', 'EUR', 'andrey.adamovich@gmail.com').id()

	let fetchEvent = (url) => {
		console.log(`Fetching event at ${url}`)
		let ticketSales = `<h2>Tickets</h2><br><b>More information and tickets is available <a href="${url}">here</a></b>.<br><br>`
		return fetch(url)
			.then(it => it.text())
			.then(cheerio.load)
			.then($ => [
				$("meta[property='og:image']").attr("content"),
				$("meta[property='dc:date']").attr("content"),
				$("meta[property='dc:price']").map((index, el) => new Ticket($(el).attr("content"))).get(),
				$("meta[property='dc:location']").attr("content"),
				$("meta[property='dc:title']").attr("content"),
				$("#description article")
					.prepend(ticketSales)
					.append($("#trainer .training"))
					.append($("#details article"))
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

	console.log(`Total number of workshops: ${workshops.get().length}`)

	let workshopsFiltered = workshops.get()
		.filter(it => it.startsWith("training/xa"))
	
	console.log(`Number of workshops after filtering: ${workshopsFiltered.length}`)

	workshopsFiltered
		.map(it => `https://devchampions.com/${it}`)
		.map(url => fetchEvent(url).then(event => event.republish()))

})
