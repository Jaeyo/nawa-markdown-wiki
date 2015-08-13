var logger = require('../util/logger').getLogger(),
	stringUtil = require('../util/string-util'),
	Post = require('../model/post'),
	precondition = require('../util/precondition'),
	marked = require('marked'),
	search = require('../search'),
	util = require('util'),
	moment = require('moment'),
	uuid = require('node-uuid'),
	jsdiff = require('diff'),
	slack = require('../util/slack');

exports.controller = function(app){
	logger.info('handler for GET "/" registered');
	app.get('/', function(req, resp){
		resp.redirect('/Wiki/index/');
	});
	// GET /
	
	logger.info('handler for GET "/Search/*" registered');
	app.get('/Search/*', function(req, resp){
		var keyword = decodeURI(req.path.substring('/Search/'.length, req.path.length));
		if(stringUtil.endsWith(keyword, '/')) keyword = keyword.substring(0, keyword.length-1);

		Promise.all([search.searchWiki(keyword), Post.titleTree()])
		.then(function(args){
			var posts = args[0];
			var titleTree = args[1];
			
			if(posts !== null){
				posts.forEach(function(post){
					post.contents = marked(stringUtil.replaceAll(post.contents, keyword, '<span class="keyword">'+keyword+'</span>'));
					post.title = stringUtil.replaceAll(post.title, keyword, '<span class="keyword">'+keyword+'</span>');
				});
			} //if
			resp.render('search', {
				postTitleTreeData: JSON.stringify(titleTree),
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

		Promise.all([Post.load(title), Post.titleTree()])
		.then(function(args){
			var post = args[0];
			var titleTree = args[1];
			
			if(post === null){
				resp.render('wiki', {
					postTitleTreeData: JSON.stringify(titleTree),
					title: title,
					contents: 'not exists',
					regdate: ''
				});
				return;
			} //if
			
			resp.render('wiki', {
				postTitleTreeData: JSON.stringify(titleTree),
				title: title,
				contents: marked(post.contents),
				regdate: moment(post.regdate).fromNow()
			});
		}).catch(function(e){
			logger.error('while loading wiki contents', {e: e.toString(), title: title, filename: __filename, line: __line});
			logger.error(e.stack);
			resp.render('err-500', {});
		});
	});
	// GET /Wiki/*
	
	logger.info('handler for GET "/WikiHistory/*" registered');
	app.get('/WikiHistory/*', function(req, resp){
		var title = decodeURI(req.path.substring('/WikiHistory/'.length, req.path.length));
		if(stringUtil.endsWith(title, '/')) title = title.substring(0, title.length-1);
		
		Promise.all([ Post.loadHistory(title), Post.titleTree() ])
		.then(function(args){
			var posts = args[0];
			var titleTree = args[1];
			
			resp.render('wiki-history', {
				title: title,
				postTitleTreeData: JSON.stringify(titleTree),
				posts: posts
			});
		}).catch(function(e){
			logger.error('while loading wiki history', {e: e.toString(), title: title, filename: __filename, line: __line});
			logger.error(e.stack);
			resp.render('err-500', {});
		});
	}); 
	// GET /WikiHistory/*
	
	logger.info('handler for GET "/WikiArchive/:uuid/" registered');
	app.get('/WikiArchive/:uuid/', function(req, resp){
		var uuid = req.params.uuid;
		
		Promise.all([ Post.loadByUUID(uuid), Post.titleTree() ])
		.then(function(args){
			var post = args[0];
			var titleTree = args[1];
			
			resp.render('wiki', {
				postTitleTreeData: JSON.stringify(titleTree),
				title: post.title,
				contents: marked(post.contents),
				regdate: moment(post.regdate).fromNow()
			});
		}).catch(function(e){
			logger.error('while loading wiki archive', {e: e.toString(), title: title, filename: __filename, line: __line});
			logger.error(e.stack);
			resp.render('err-500', {});
		});
	});
	// GET /WikiArchive/:uuid/
	
	logger.info('handler for GET "/WikiArchiveRaw/:uuid/" registered');
	app.get('/WikiArchiveRaw/:uuid/', function(req, resp){
		var uuid = req.params.uuid;
		
		Promise.all([ Post.loadByUUID(uuid), Post.titleTree() ])
		.then(function(args){
			var post = args[0];
			var titleTree = args[1];
			
			resp.render('wiki-raw', {
				postTitleTreeData: JSON.stringify(titleTree),
				title: post.title,
				raw: post.contents
			});
		}).catch(function(e){
			logger.error('while loading wiki archive raw', {e: e.toString(), title: title, filename: __filename, line: __line});
			logger.error(e.stack);
			resp.render('err-500', {});
		});
	});
	// GET /WikiArchiveRaw/:uuid/
	
	logger.info('handler for GET "/WikiDiff/:leftPostUUID/:rightPostUUID/" registered');
	app.get('/WikiDiff/:leftPostUUID/:rightPostUUID/', function(req, resp){
		var leftPostUUID = req.params.leftPostUUID;
		var rightPostUUID = req.params.rightPostUUID;
		
		Promise.all([ Post.loadByUUID(leftPostUUID), Post.loadByUUID(rightPostUUID), Post.titleTree() ])
		.then(function(args){
			var leftPost = args[0];
			var rightPost = args[1];
			var titleTree = args[2];
			
			var diffResult = leftPost.regdate < rightPost.regdate ? 
								jsdiff.diffLines(leftPost.contents, rightPost.contents) : 
								jsdiff.diffLines(rightPost.contents, leftPost.contents);
			
			diffResult.forEach(function(diffLine){ //DEBUG
				diffLine.value = marked(diffLine.value);
			});

			resp.render('wiki-diff', {
				title: util.format('diff: %s - %s', leftPost.title, rightPost.title),
				postTitleTreeData: JSON.stringify(titleTree),
				diff: diffResult
			});
		}).catch(function(e){
			logger.error({e: e.toString(), filename: __filename, line: __line});
			logger.error(e.stack);
			resp.render('err-500', {});
		});
	});
	// GET /WikiDiff/:leftPostUUID/:rightPostUUID/
	
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

		Promise.all([Post.load(title), Post.titleTree()])
		.then(function(args){
			var post = args[0];
			var titleTree = args[1];
			
			if(post === null)
				post = { contents: '' };
			
			resp.render('edit-wiki', {
				postTitleTreeData: JSON.stringify(titleTree),
				title: title,
				contents: post.contents
			});
		}).catch(function(e){
			logger.error({e: e.toString(), filename: __filename, line: __line});
			logger.error(e.stack);
			resp.render('err-500', {});
		});
	});
	// GET /EditWiki/*
	
	logger.info('handler for GET /RecentEditedWiki/ registered');
	app.get('/RecentEditedWiki/', function(req, resp){
		Promise.all([ Post.recentEdited(), Post.titleTree() ])
		.then(function(args){
			var posts = args[0];
			var titleTree = args[1];
			
			posts.forEach(function(post){
				post.regdate = moment(post.regdate).fromNow();
			});
			
			resp.render('recent-edited', {
				postTitleTreeData: JSON.stringify(titleTree),
				title: 'recent edited',
				posts: posts
			});
		}).catch(function(e){
			logger.error('while load recent edited posts', {e: e.toString(), filename: __filename, line: __line});
			logger.error(e.stack);
			resp.json({ success: 0, errmsg: 'error while editing post' });
		});
	});
	// GET /RecentEditedWiki/
	
	logger.info('handler for GET "/Export/EntireWiki/ registered');
	app.get('/Export/EntireWiki/', function(req, resp){
		Post.loadAll().then(function(posts){
			resp.attachment('wiki.json');
			resp.end(JSON.stringify(posts, null, 2), 'utf-8');
		}).catch(function(e){
			logger.error('while load recent edited posts', {e: e.toString(), filename: __filename, line: __line});
			logger.error(e.stack);
			resp.json({ success: 0, errmsg: 'error while export entire wiki' });
		});
	});
	// GET /Export/EntireWiki/
	
	logger.info('handler for GET "/Setting/ registered');
	app.get('/Setting/', function(req, resp){
		Post.titleTree().then(function(titleTree){
			resp.render('setting', {
				title: 'setting',
				postTitleTreeData: JSON.stringify(titleTree)
			});
		}).catch(function(e){
			logger.error('while load setting page', {e: e.toString(), filename: __filename, line: __line});
			logger.error(e.stack);
			resp.json({ success: 0, errmsg: 'error while setting page' });
		});
	});
	// GET /Setting/
	
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

		var post = new Post().setTitle(title).setContents(contents).setRegdate(new Date()).setIsRecent(true).setUUID(uuid.v4());
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
	
	logger.info('handler for POST "/Export/Slack/');
	app.post('/Export/Slack/', function(req, resp){
		var param = JSON.parse(req.body['param']);
		var channel = param.channel;
		var title = param.title;
		var msg = param.msg;
		
		msg = util.format('%s\nhttp://%s/Wiki/%s', msg, req.headers.host, title);
		
		slack.sendToSlack(channel, msg).then(function(){
			resp.json({ success: 1 });
		}).catch(function(e){
			logger.error('error while send wiki to slack', {e: e.toString(), filename: __filename, line: __line});
			logger.error(e.stack);
			resp.json({ success: 0, errmsg: 'error while send wiki to slack' });
		});
	});
	// POST /Export/Slack/
	
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
