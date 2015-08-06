var fs = require('fs'),
	mkdirp = require('mkdirp');

var getDirName = require('path').dirname;

exports.writeFile = function(path, contents){
	return new Promise(function(resolve, reject){
		mkdirp(getDirName(path), function(err){
			if(err) reject(err);
			fs.writeFile(path, contents, function(err){
				if(err) reject(err);
				resolve();
			});
		});
	});
}; //writeFile
