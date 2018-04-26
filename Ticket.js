class Ticket {

	constructor(offer) {
		let [name, price] = offer.split(',')
		this.name = name.trim();
		this.price = price.trim();
		if (!Number(this.price)) {
			throw `Ticket price is not a number ${this.price}`
		}
		console.log(`Ticket (${this.name}) costs ${this.price}`)
	}

}

export default Ticket