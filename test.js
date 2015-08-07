var songbird = require('songbird'),
	test = require('./test12');
	
//test.test1(1, 2, function(v){ console.log(v); })

test.promise.test1(1, 2).then(function(v){ console.log(v); });