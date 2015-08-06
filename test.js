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

function test1(){
	console.log('test1');
	test2();
}; //test1

function test2(){
	console.log('test2');
	console.log(new Error().stack);
}; //test2


test1();
