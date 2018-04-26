import cityTimezones from 'city-timezones'

class Timezone {

	constructor(city) {

		let timezones = cityTimezones.lookupViaCity(city)
								  .filter(it => it.iso3 != "CAN")
								  .filter(it => it.iso3 != "USA")

		if (timezones.length != 1) {
			throw `Cannot find unique timezone for ${city}`
		}
		
		this.timezone = timezones.pop().timezone		
	}

	toString() {
		return this.timezone
	}

}

export default Timezone