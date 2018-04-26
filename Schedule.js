import moment from 'moment-timezone'

const inFormat = "DD-MMM-YYYY HH:mm"
const outFormat = "YYYY-MM-DDTHH:mm:ss"

class Schedule {

	constructor(date, timezone) {

		this.timezone = timezone.toString()

		let parts = date.split(" ")
		if (parts.length < 3) {
			throw `Invalid date format passed [${date}]. Examples of correct date: 22-23 Mar 2018 or 23 Mar 2018`
		}

		let [days, month, year] = parts

		let fromTo = days.split("-")

		if (fromTo.length == 2) {
			let [from, to] = fromTo
			this.startsOnIso = moment(`${from}-${month}-${year} 09:00`, inFormat).tz(timezone).utc().format(outFormat) + "Z"
			this.endsOnIso = moment(`${to}-${month}-${year} 18:00`, inFormat).tz(timezone).utc().format(outFormat) + "Z"			
		} else {
			this.startsOnIso = moment(`${days}-${month}-${year} 09:00`, inFormat).tz(timezone).utc().format(outFormat) + "Z"
			this.endsOnIso = moment(`${days}-${month}-${year} 18:00`, inFormat).tz(timezone).utc().format(outFormat) + "Z"			
		}	
	}

}

export default Schedule