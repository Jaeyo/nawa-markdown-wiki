var winston = require('winston'),
	conf = require('./conf');

exports.getLogger = function(){
	return new (winston.Logger)({
		transports: [
			new (winston.transports.Console)(conf.logger.console),
			new (winston.transports.File)(conf.logger.file)
		]
	});
}; //getLogger
