const firebaseEvents = 'https://dc-publisher.firebaseio.com/eventbrite/events.json'

class Snapshot {

	constructor(id) {

	}

	store(eventbriteId, body) {
		return axios.post(firebaseEvents, { evt_id: eventbriteId, evt_body: body, ext_id: this.id})
					.then(it => eventbriteId)
	}

	fetch() {
		return axios.get(`${firebaseEvents}?orderBy="ext_id"&equalTo="${this.id}"`)
			.then(it => [it.data]
					.map(Object.values)
					.pop()
					.map(it => [it.evt_id, it.evt_body])
					.pop())
			.catch(e => { throw `Exception while retrieving an event from Firebase ${this.id}: ${e}` })
	}

}

export default Snapshot

