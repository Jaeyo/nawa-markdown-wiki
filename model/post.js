var conf = require('../util/conf'),
	nedbModel = require('./nedb/post'),
	logger = require('../util/logger').getLogger();

var model = null;
if(conf.repository === 'nedb'){
	logger.info('repository model set to nedb');
	model = nedbModel;
} else{
	logger.info('repository model set to nedb(default)');
	model = nedbModel;
} //if

module.exports = model;