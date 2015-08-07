var express = require('express'),
	bodyParser = require('body-parser'),
	fs = require('fs'),
	path = require('path'),
	search = require('./search'),
	conf = require('./util/conf'),
	logger = require('./util/logger').getLogger(),
	app = express(),
	server = require('http').Server(app),
	io = require('socket.io').listen(server);

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

app.listen(app.get('port'), function(){
	logger.info('express server listening on port ' + app.get('port'));
});

io.sockets.on('connection', function(socket){
	logger.debug('on connection', {socket: socket}); //DEBUG
	socket.emit('news', { hello: 'world' });
	socket.on('my other event', function(data){
		console.log(data);
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
