module.exports = {
	port: 80,
	logger: {
		console: {
			level: 'debug',
			colorize: true,
			timestamp: true,
			prettyPrint: true
		}, 
		file: {
			level: 'debug',
			json: false,
			colorize: false,
			timestamp: true,
			prettyPrint: true,
			filename: 'wiki.log',
			maxsize: 5242880,
			maxFiles: 5
		}
	} 
};
