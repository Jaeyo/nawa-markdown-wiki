module.exports = {
	port: 8888,
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
	},
	slackWebhookUri: 'https://hooks.slack.com/services/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',
	repository: 'nedb'
};
