var logger = require('../util/logger').getLogger(),
	fsUtil = require('../util/fs-util'),
	PostMeta = require('./post-meta'),
	fs = require('fs'),
	moment = require('moment'),
	path = require('path'),
	walk = require('walk'),
	Joi = require('joi');

function Post(){
	/*
	 * {
	 * 		title: (string),
	 * 		contents: (string),
	 * 		regdate: (date)
	 * }
	 */
} //INIT

module.exports = Post;

var schema = Joi.object().keys({
	title: Joi.string(),
	contents: Joi.string(),
	regdate: Joi.date()
});

Post.prototype = {
	setTitle: function(title){
		this.title = title;
		Joi.validate(this, schema, function(err, value){ if(err) throw err; });
		return this;
	}, //setTitle

	setContents: function(contents){
		this.contents = contents;
		Joi.validate(this, schema, function(err, value){ if(err) throw err; });
		return this;
	}, //setContents

	setRegdate: function(regdate){
		this.regdate = regdate;
		Joi.validate(this, schema, function(err, value){ if(err) throw err; });
		return this;
	} //setRegdate
}; //Post

Post.save = function(post){
	Joi.validate(post, schema, function(err, value){ if(err) throw err; });
	var filename = post.title + '.' + moment().format('YYYYMMDDHHmmss') + '.md';
	return new Promise(function(resolve, reject){
		fsUtil.writeFile('data/' + filename, post.contents)
		.then(function(){
			return PostMeta.refresh();
		}).then(function(){
			resolve();
		}).catch(function(e){
			reject(JSON.stringify({err: e, filename: __filename, line: __line}));
		});
	});
}; //save

Post.load = function(title){
	return new Promise(function(resolve, reject){
		var postMeta = PostMeta.load(title);
		if(postMeta === undefined ){
			reject(JSON.stringify({errmsg: 'no post exists', title: title, filename: __filename, line: __line}));
			return;
		} //if

		var filepath = path.join('data/', postMeta.filename);
		var regdate = moment(/(.*)(\.)(\d{14})(.md)$/g.exec(postMeta.filename)[3], 'YYYYMMDDHHmmss').toDate();
		fs.readFile(filepath, {encoding: 'utf8'}, function(err, data){
			if(err){
				 reject(JSON.stringify({err: err, filename: __filename, line: __line}));
				 return;
			} //if
			
			resolve(new Post().setTitle(title).setContents(data).setRegdate(regdate));
		});
	});
}; //load

Post.delete = function(title){
	return new Promise(function(resolve, reject){
		var walker = walk.walk('./data', {followLinks: false});
		var regex = new RegExp('(' + title + '.)(\\d{14})(.md)$');
		walker.on('file', function(root, file, next){
			try{
				var filepath = path.join(root, file.name).substring('data/'.length);
				if(regex.test(filepath) === false)
					return;
				
				var targetFile = path.join(root, file.name);
				fs.rename(targetFile, targetFile+'.deleted', function(err){
					if(err) reject(JSON.stringify({ err: err, filename: __filename, line: __line }));
				});
			} finally{
				next();
			} //finally
		});

		walker.on('end', function(){
			resolve();
		});
	});
}; //delete
