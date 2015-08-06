var lunr = require('lunr'),
	Post = require('./model/post'),
	logger = require('./util/logger').getLogger();

var wikiIndex = lunr(function(){
	this.field('title', 100);
	this.field('contents', 10);
});

function indexPost(post){
	logger.debug('index', {title: post.title}); 
	var doc = {
		title: encodeURI(post.title)
					.replace(/%20/gi, ' ')
					.replace(/\//gi, ' '),
		contents: encodeURI(post.contents)
					.replace(/%20/gi, ' ')
					.replace(/\//gi, ' '),
		id: post.title
	};
	wikiIndex.add(doc);
}; //indexPost

exports.indexPost = indexPost;

exports.indexAllPost = function(){
	Post.loadAll().then(function(posts){
		posts.forEach(function(post){
			indexPost(post);
		});
	}).catch(function(e){
		logger.error({ err: e.toString(), filename: __filename, line: __line });
	});
}; //indexAllPost

exports.unindexPost = function(title){
	wikiIndex.remove({ id: title });
}; //unindexPost

exports.searchWiki = function(keyword){
	return new Promise(function(resolve, reject){
		logger.debug({keyword: keyword});
		keyword = encodeURI(keyword).replace(/%20/gi, ' ');

		var results = wikiIndex.search(keyword);
		if(results.length === 0){
			resolve(null);
			return;
		} //if

		var posts = [];
		var loadPostFuncs = [];
		results.forEach(function(r){
			var title = r.ref;
			loadPostFuncs.push(new Promise(function(resolve, reject){
				Post.load(title).then(function(post){
					posts.push(post);
					resolve();
				}).catch(function(e){
					reject(JSON.stringify({err: e.toString(), filename: __filename, line: __line}));
				});
			}));
		});

		Promise.all(loadPostFuncs).then(function(){
			resolve(posts);
		}).catch(function(e){
			reject(JSON.stringify({err: e.toString(), filename: __filename, line: __line}));
		});
	});
}; //searchWiki
