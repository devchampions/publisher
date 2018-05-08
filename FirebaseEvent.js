
class Snapshot {

	constructor(id) {
		let firebaseStore = process.env.FIREBASE_STORE
		if (!firebaseStore) {
			throw "Please provide FIREBASE_STORE env variable. E.g. http://project.firebaseio.com/store"
		}
		this.firebaseVenues = `${firebaseStore}/events.json`
	}

	store(eventbriteId, body) {
		return axios.post(this.firebaseEvents, { evt_id: eventbriteId, evt_body: body, ext_id: this.id})
					.then(it => eventbriteId)
	}

	fetch() {
		return axios.get(`${this.firebaseEvents}?orderBy="ext_id"&equalTo="${this.id}"`)
			.then(it => [it.data]
					.map(Object.values)
					.pop()
					.map(it => [it.evt_id, it.evt_body])
					.pop())
			.catch(e => { throw `Exception while retrieving an event from Firebase ${this.id}: ${e}` })
	}

}

export default Snapshot

