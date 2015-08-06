var logger = require('../util/logger').getLogger(),
	fsUtil = require('../util/fs-util'),
	stringUtil = require('../util/string-util'),
	walk = require('walk'),
	moment = require('moment'),
	path = require('path'),
	Joi = require('joi');

/*
 *	list[title]: {
 *		{ (PostMeta) }
 *	}
 */
var globalVar = {
	list: {}
}; //globalVar

/*
 * {
 *	filename: (string)(with path),
 *	title: (string),
 *	regdate: (date)
 *	}
 */
function PostMeta(){
} //INIT

module.exports = PostMeta;

var schema = Joi.object().keys({
	filename: Joi.string(),
	title: Joi.string(),
	regdate: Joi.date()
});

PostMeta.prototype = {
	setFilename: function(filename){
		this.filename = filename;
		Joi.validate(this, schema, function(err, value){ if(err) throw err; });
		return this;
	}, //setFilename

	setTitle: function(title){
		this.title = title;
		Joi.validate(this, schema, function(err, value){ if(err) throw err; });
		return this;
	}, //setTitle

	setRegdate: function(regdate){
		this.regdate = regdate;
		Joi.validate(this, schema, function(err, value){ if(err) throw err; });
		return this;
	} //setRegdate
}; //PostMeta

PostMeta.list = function(){
	var list = [];
	for(var i=0; i<globalVar.list.length; i++){
		var postMeta = globalVar.list[i];
		list.push(new PostMeta()
					.setFilename(postMeta.filename)
					.setTitle(postMeta.title)
					.setRegdate(postMeta.regdate));
	} //for in globalVar.list
	return list;
}; //list

PostMeta.titles = function(){
	var titles = [];
	for(var title in globalVar.list)
		titles.push(title);
	return titles;
}; //list

PostMeta.titleTree = function(){
	var treeData = [];
	for(var title in globalVar.list){
		if(title.indexOf('/') < 0) {
			treeData.push({ text: title, data: '/Wiki/'+title+'/', icon: 'glyphicon glyphicon-file' });
			continue;
		} //if
		
		var findNodeWithText = function(root, text){
			for(var i=0; i<root.length; i++)
				if(root[i].text === text && root[i].children !== undefined) return root[i];
			return null;
		}; //isRootHasObjectWithText

		var root = treeData;
		var splitedTitle = title.split('/');
		for(var i=0; i<splitedTitle.length; i++){
			var word = splitedTitle[i];

			if(i === splitedTitle.length-1){ //if post
				root.push({ text: word, data: '/Wiki/'+title+'/', icon: 'glyphicon glyphicon-file' });
				continue;
			}  //if

			var node = findNodeWithText(root, word); 
			if(node !== null){ //if folder exists
				root = node.children;
				continue;
			} //if

			//if folder not exists
			var children = [];
			root.push({ text: word, state: {opened: true}, children: children });
			root = children;
		} //for in splitedTitle
	} //for title

	return treeData;
}; //titleTree

PostMeta.load = function(title){
	return globalVar.list[title];
}; //load

PostMeta.loadHistory = function(title){
	return new Promise(function(resolve, reject){
		try{
			var walker = walk.walk('./data', {followLinks: false});
			var regex = new RegExp('(' + title + '.)(\\d{14})(.md)$');
			var histories = [];
			walker.on('file', function(root, file, next){
				try{
					var filepath = path.join(root, file.name).substring('data/'.length); //path/to/file/title.201501010100.md
					if(regex.test(filepath) === false)
						return;

					var splitedFilename = file.name.split('.');
					var regdate = moment(splitedFilename[splitedFilename.length - 2], 'YYYYMMDDHHmmss');
					var splitedFilepath = filepath.split('.');
					var title = splitedFilepath.splice(0, splitedFilepath.length-2).join('.');

					histories.push( new PostMeta().setFilename(filepath).setTitle(title).setRegdate(regdate) );
				} finally{
					next();
				} //finally
			});

			walker.on('end', function(){
				resolve(histories);
			});
		} catch(e){
			reject(JSON.stringify({err: e, filename: __filename, line: __line}));
		} //finally
	});
}; //loadHistory

PostMeta.refresh = function(){
	return new Promise(function(resolve, reject){
		globalVar.list = {};

		try{
			logger.debug('PostMeta.refresh() started');
			var walker = walk.walk('./data', {followLinks: false});
			var recentPostFiles = [];
			walker.on('file', function(root, file, next){
				try{
					if(/(.*\.)\d{14}(.md)$/g.test(file.name) === false)
						return;

					var filepath = path.join(root, file.name).substring('data/'.length); // path/to/file/title.20150101010100.md
					var splitedFilename = file.name.split('.');
					var regdate = moment(splitedFilename[splitedFilename.length - 2], 'YYYYMMDDHHmmss').toDate();
					var splitedFilepath = filepath.split('.');
					var title = splitedFilepath.splice(0, splitedFilepath.length-2).join('.');

					if(globalVar.list[title] === undefined){
						globalVar.list[title] = new PostMeta().setFilename(filepath).setTitle(title).setRegdate(regdate);
						return;
					} //if

					if(globalVar.list[title].regdate < regdate){
						globalVar.list[title] = new PostMeta().setFilename(filepath).setTitle(title).setRegdate(regdate);
						return;
					} //if
				} finally{
					next();
				} //finally
			});

			walker.on('end', function(){
				logger.debug('PostMeta.refresh() finished');
				resolve();
			});
		} catch(e){
			reject(JSON.stringify({err: e, filename: __filename, line: __line}));
		} //catch
	});
}; //refresh
