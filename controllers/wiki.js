var logger = require('../util/logger').getLogger(),
	uuid = require('node-uuid'),
	stringUtil = require('../util/string-util'),
	PostMeta = require('../model/post-meta'),
	Post = require('../model/post'),
	precondition = require('../util/precondition'),
	marked = require('marked'),
	search = require('../search'),
	util = require('util'),
	moment = require('moment');

exports.controller = function(app){
	logger.info('handler for GET "/" registered');
	app.get('/', function(req, resp){
		resp.redirect('/Wiki/index/');
	});
	// GET /
	
	//DEBUG
	app.get('/Test/', function(req, resp){
		resp.render('test', {
			postTitleTreeData: JSON.stringify(PostMeta.titleTree()),
		});
	});
	// GET /Test/
	
	logger.info('handler for GET "/Search/*" registered');
	app.get('/Search/*', function(req, resp){
		var keyword = decodeURI(req.path.substring('/Search/'.length, req.path.length));
		if(stringUtil.endsWith(keyword, '/')) keyword = keyword.substring(0, keyword.length-1);

		search.searchWiki(keyword).then(function(posts){
			if(posts !== null){
				posts.forEach(function(post){
					post.contents = marked(stringUtil.replaceAll(post.contents, keyword, '<span class="keyword">'+keyword+'</span>'));
					post.title = stringUtil.replaceAll(post.title, keyword, '<span class="keyword">'+keyword+'</span>');
					/*
					post.contents = stringUtil.replaceAll(marked(post.contents), keyword, '<span class="keyword">'+keyword+'</span>');
					post.title = stringUtil.replaceAll(post.title, keyword, '<span class="keyword">'+keyword+'</span>');
					*/

				});
			} //if
			resp.render('search', {
				postTitleTreeData: JSON.stringify(PostMeta.titleTree()),
				keyword: keyword,
				results: posts
			});
		}).catch(function(e){
			logger.error('while searching', {e: e.toString(), keyword: keyword, filename: __filename, line: __line});
			logger.error(e.stack);
			resp.render('err-500', {});
			return;
		});
	});
	// GET /Search/*

	logger.info('handler for GET "/Wiki/*" registered');
	app.get('/Wiki/*', function(req, resp){
		var title = decodeURI(req.path.substring('/Wiki/'.length, req.path.length));
		if(stringUtil.endsWith(title, '/')) title = title.substring(0, title.length-1);

		if(title === null || title.length === 0) title = 'index';

		Post.load(title)
		.then(function(post){
			resp.render('wiki', {
				postTitleTreeData: JSON.stringify(PostMeta.titleTree()),
				title: title,
				contents: marked(post.contents),
				regdate: moment(post.regdate).fromNow()
			});
		})
		.catch(function(e){
			if(e.indexOf('no post exists') < 0){
				logger.error('while loading wiki contents', {e: e.toString(), title: title, filename: __filename, line: __line});
				logger.error(e.stack);
				resp.render('err-500', {});
			} //if
			resp.render('wiki', {
				postTitleTreeData: JSON.stringify(PostMeta.titleTree()),
				title: title,
				contents: 'post not exists',
				regdate: ''
			});
		});
	});
	// GET /Wiki/*
	
	logger.info('handler for GET "/EditWiki/*" registered');
	app.get('/EditWiki/*', function(req, resp){
		var title = decodeURI(req.path.substring('/EditWiki/'.length, req.path.length));
		if(stringUtil.endsWith(title, '/')) title = title.substring(0, title.length-1);

		try{
			precondition
				.check(title !== null, 'title cannot be null')
				.check(title.length !== 0, 'title cannot be empty');
		} catch(e){
			logger.error({e: e.toString(), filename: __filename, line: __line});
			logger.error(e.stack);
			resp.render('err-500', {});
			return;
		} //catch

		Post.load(title)
		.then(function(post){
			resp.render('edit-wiki', {
				postTitleTreeData: JSON.stringify(PostMeta.titleTree()),
				title: title,
				contents: post.contents
			});
		})
		.catch(function(e){
			if(e.indexOf('no post exists') < 0){
				logger.error('while loading wiki contents', {e: e.toString(), title: title, filename: __filename, line: __line});
				logger.error(e.stack);
				resp.render('err-500', {});
				return;
			} //if

			resp.render('edit-wiki', {
				postTitleTreeData: JSON.stringify(PostMeta.titleTree()),
				title: title,
				contents: ''
			});
		});
	});
	// GET /EditWiki/*
	
	logger.info('handler for GET "/WikiHistory/*" registered');
	app.get('/WikiHistory/*', function(req, resp){
		var title = decodeURI(req.path.substring('/WikiHistory/'.length, req.path.length));
		if(stringUtil.endsWith(title, '/')) title = title.substring(0, title.length-1);
		
		try{
			precondition
				.check(title !== null, 'title cannot be null')
				.check(title.length !== 0, 'title cannot be empty');
		} catch(e){
			logger.error({e: e.toString(), filename: __filename, line: __line});
			logger.error(e.stack);
			resp.render('err-500', {});
			return;
		} //catch

		PostMeta.loadHistory(title)
		.then(function(histories){
			resp.render('history', {histories: histories}); //TODO IMME
		})
		.catch(function(e){
			logger.error({e: e.toString(), filename: __filename, line: __line});
			logger.error(e.stack);
			resp.render('err-500', {e: e});
			return;
		});
		//TODO IMME

	});
	// GET /WikiHistory/*

	logger.info('handler for POST "/Wiki/" registered');
	app.post('/Wiki/', function(req, resp){
		var param = JSON.parse(req.body['param']);
		var title = param.title;
		var contents = param.contents;
		logger.info('edit wiki', { filename: __filename, line: __line, title: title });

		try{
			precondition
				.check(title !== null, 'title cannot be null')
				.check(title.length !== 0, 'title cannot be empty')
				.check(title.indexOf('/') !== 0, 'slash(/) cannot be in first of title')
				.check(title.lastIndexOf('/')+1 !== title.length, 'slash(/) cannot be in last of title');
		} catch(e){
			logger.error({e: e.toString(), filename: __filename, line: __line});
			logger.error(e.stack);
			resp.json({ success: 0, errmsg: e });
			return;
		} //catch

		var post = new Post().setTitle(title).setContents(contents);
		Post.save(post).then(function(){
			search.indexPost(post);
			resp.json({ success: 1, title: title });
		}).catch(function(e){
			logger.error('while editing post', {e: e.toString(), filename: __filename, line: __line});
			logger.error(e.stack);
			resp.json({ success: 0, errmsg: 'error while editing post' });
		});
	});
	// POST /Wiki/
	
	logger.info('handler for DELETE "/Wiki/" registered');
	app.delete('/Wiki/', function(req, resp){
		var param = JSON.parse(req.body['param']);
		var title = param.title;

		try{
			precondition
				.check(title !== null, 'title cannot be null')
				.check(title.length !== 0, 'title cannot be empty')
				.check(title.indexOf('/') !== 0, 'slash(/) cannot be in first of title')
				.check(title.lastIndexOf('/')+1 !== title.length, 'slash(/) cannot be in last of title');
		} catch(e){
			logger.error({e: e.toString(), filename: __filename, line: __line});
			logger.error(e.stack);
			resp.json({ success: 0, errmsg: e });
			return;
		} //catch

		Post.delete(title)
		.then(function(){
			PostMeta.refresh();
			search.unindexPost(title);
			resp.json({ success: 1 });
		})
		.catch(function(e){
			logger.error('while deleting post', {e: e.toString(), filename: __filename, line: __line});
			logger.error(e.stack);
			resp.json({success: 0, errmsg: 'error while deleting post' });
		});
	});
	// DELETE /Wiki/

	logger.info(util.format('all handler in %s registered', __filename));
}; //controller
