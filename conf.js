exports = {
	logger: {
		console: {
			level: 'debug',
			colorize: true,
			timestamp: true,
			prettyPrint: true
		},  //console
		file: {
			level: 'debug',
			json: false,
			colorize: false,
			timestamp: true,
			prettyPrint: true,
			filename: 'logs/vote.log',
			maxsize: 5242880,
			maxFiles: 5
		} //file
	}  //logger
};
