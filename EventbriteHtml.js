import he from 'he'
import {URL} from 'url'


class EventbriteHtml {
	
	constructor(url, anyHtml) {
		this.url = new URL(url)
    	this.html = he.decode(
    			anyHtml
	    			.replace(/<(p|\/p)*?>/gm, '<br>')
	    			.replace(/<(hr|\/hr)*?>/gm, '<br><br><hr>')	    			
	    			.replace(/<(h4|\/h4)*?>/gm, '<br>')
					.replace(/<(\/h1)*?>/gm, '</h3>')
					.replace(/<(\/h2)*?>/gm, '</h3>')
					.replace(/<(h1.*?)>/gm, '<br><br><h3>')
					.replace(/<(h2)*?>/gm, '<br><br><h3>')
					.replace(/<(\/strong)*?>/gm, '</b>')
					.replace(/<(strong)*?>/gm, '<b>')
					.replace(/<(\/blockquote)*?>/gm, '</em><br>')
					.replace(/<(blockquote)*?>/gm, '<br><em>')
					.replace(/<(\/li)*?>/gm, '<br>')
					.replace(/<(li)*?>/gm, '<br>✅ ')
	    			.replace(/<\/?section.*?>/gm, '')
	    			.replace(/<\/?header.*?>/gm, '')
	    			.replace(/<\/?ul.*?>/gm, '')
	    			.replace(/<\/?i(?!m).*?>/gm, '')
	    			.replace(/src="\/(.*?)"/gm, `src="${this.url.origin}/$1"`)
	    			.replace(/class="(.*?)"/gm, '')
	    			.replace(/<\/?div.*?>/gm, ''))
	}
	
	toString() {
		return this.html		
	}

}

export default EventbriteHtml