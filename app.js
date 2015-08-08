var express = require('express'),
	bodyParser = require('body-parser'),
	fs = require('fs'),
	path = require('path'),
	search = require('./search'),
	conf = require('./util/conf'),
	logger = require('./util/logger').getLogger(),
	app = express(),
	io = require('socket.io'),
	platform = require('platform');

app.set('port', conf.port);
//app.set('port', process.env.PORT);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'bower_components')));

fs.readdirSync('./controllers').forEach(function(file){
	if(file.substr(-3) == '.js'){
	var route = require('./controllers/' + file);
	route.controller(app);
	} //if
});

setGlobalProperties();

search.indexAllPost();

logger.info({
	platform: {
		name: platform.name,
		version: platform.version,
		osArchitecture: platform.os.architecture,
		osFamily: platform.os.family,
		description: platform.description
	}
});

var server = app.listen(app.get('port'), function(){
	logger.info('express server listening on port ' + app.get('port'));
});

var socket = io.listen(server, {log: true});
socket.on('connection', function(client){
	logger.debug('on connection');
	client.emit('news', { hello: 'world' });
	client.on('here', function(data){
		logger.debug('on here, ' + data);
	});
});



function setGlobalProperties(){
	Object.defineProperty(global, '__stack', {
		get: function(){
			var orig = Error.prepareStackTrace;
			Error.prepareStackTrace = function(_, stack){ return stack; };
			var err = new Error;
			Error.captureStackTrace(err, arguments.callee);
			var stack = err.stack;
			Error.prepareStackTrace = orig;
			return stack;
		}
	});
	
	Object.defineProperty(global, '__line', {
		get: function(){
			return __stack[1].getLineNumber();
		}
	});
	
	Object.defineProperty(global, '__filename', {
		get: function(){
			return __stack[1].getEvalOrigin();
		}
	});
}; //setGlobalProperties
