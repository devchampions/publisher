'use strict'

import gulp from 'gulp'
import axios from 'axios'
import Octokat from 'Octokat'

gulp.task('default', () => {
	let octo = new Octokat()
	let repo = octo.repos('devchampions', 'publisher')

	repo.contents('/meta/eb_events.txt')
		.readBinary()
		.then(info => {
  			console.log(info)
		})
})