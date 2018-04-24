
/**
 * String or regexp used to separate sections of movie definition, e.g.
 * default value, scenario and editor options
 */
const SECTION_SEPARATOR = '@@@'
	
/** Regular expression to extract outline from scenario line */
const OUTLINE_SEPARATOR = /\s+:::\s+(.+)$/

const COMMAND_REGEX = /^(\w+)\s*:\s*(.+)$/ 


const toLines = text => {
	// IE fails to split string by regexp, 
	// need to normalize newlines first
	const lines = (text || '')
		.replace(/(\r\n|\n\r|\r)/g, '\n')
		.split('\n')

	return lines.filter(Boolean)
}

const unescape = text => {
	const replacements = {
		'&lt;': '<',
		'&gt;': '>',
		'&amp;': '&'
	}

	return text.replace(/&(lt|gt|amp);/g, str => replacements[str] || str)
}


export default text => {
	const parts = text.split(SECTION_SEPARATOR)

	const actions = toLines(parts[1])
		.map(line => line.trim())
		.filter(line => line && line.charAt(0) !== '#')
		.map(line =>
			line
				.replace(OUTLINE_SEPARATOR, '')
				.match(COMMAND_REGEX)
		).filter(Boolean)
		.map(sd => {
			
			const name = sd[1]
			let actionOptions = unescape(sd[2])

			if (actionOptions.charAt(0) === '{') {
				actionOptions = JSON.parse(actionOptions)
			}

			return {
				name,
				options: actionOptions
			}
		})

	return {
		value: unescape(parts[0].trim()),
		actions
	}
}
