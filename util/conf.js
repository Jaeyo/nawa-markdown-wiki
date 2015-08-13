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
