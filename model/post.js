var logger = require('../util/logger').getLogger(),
	Joi = require('joi'),
	postDB = require('../db/db').postDB,
	Promise = require('songbird');

function Post(){
	/*
	 * {
	 * 		title: (string),
	 * 		contents: (string),
	 * 		regdate: (date),
	 * 		isRecent: (boolean)
	 * }
	 */
} //INIT

module.exports = Post;

var schema = Joi.object().keys({
	uuid: Joi.string(),
	title: Joi.string(),
	contents: Joi.string(),
	regdate: Joi.date(),
	isRecent: Joi.boolean()
});


Post.prototype = {
	setUUID: function(uuid){
		this.uuid = uuid;
		Joi.validate(this, schema, function(err, value){ if(err) throw err; });
		return this;
	}, //setUUID
	
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
	}, //setRegdate
	
	setIsRecent: function(isRecent){
		this.isRecent = isRecent;
		Joi.validate(this, schema, function(err, value){ if(err) throw err; });
		return this;
	} //setIsrecent
}; //Post

Post.save = function(post){
    return new Promise(function(resolve, reject){
        postDB.promise.update({ title: post.title, isRecent: true }, 
            { $set: { isRecent: false } }, 
            { multi: true })
        .then(postDB.promise.insert(post))
        .then(function(newDoc){
            resolve();
        }).catch(function(e){
            reject(e); 
        });
    });
}; //save

Post.load = function(title){
	return new Promise(function(resolve, reject){
		postDB.findOne({title: title, isRecent: true}, function(err, doc){
			if(err){ reject(err); return; }
			if(doc === null){ resolve(null); return; }
			var post = new Post()
				.setTitle(doc.title)
				.setContents(doc.contents)
				.setRegdate(doc.regdate)
				.setIsRecent(doc.isRecent)
				.setUUID(doc.uuid)
			resolve(post);
		});
	});
}; //load

Post.loadHistory = function(title){
	return new Promise(function(resolve, reject){
		postDB.find({ title: title })
		.sort({ regdate: -1 })
		.promise
		.exec()
		.then(function(docs){
			var posts = [];
			docs.forEach(function(doc){
				var post = new Post()
					.setTitle(doc.title)
					.setContents(doc.contents)
					.setRegdate(doc.regdate)
					.setIsRecent(doc.isRecent)
					.setUUID(doc.uuid);
				posts.push(post);
			});
			resolve(posts);
		}).catch(function(e){
			reject(e);
		});
	});
}; //loadHistory

Post.loadByUUID = function(uuid){
	return new Promise(function(resolve, reject){
		postDB.promise.findOne({ uuid: uuid })
		.then(function(doc){
			if(doc === null){ resolve(null); return; }
			var post = new Post()
				.setTitle(doc.title)
				.setContents(doc.contents)
				.setRegdate(doc.regdate)
				.setIsRecent(doc.isRecent)
				.setUUID(doc.uuid);
			resolve(post);
		}).catch(function(e){
			reject(e);
		});
	});
}; //loadById

Post.loadAll = function(){
	return new Promise(function(resolve, reject){
		postDB.promise.find(null)
		.then(function(docs){
			var posts = [];
			docs.forEach(function(doc){
				var post = new Post()
					.setTitle(doc.title)
					.setContents(doc.contents)
					.setRegdate(doc.regdate)
					.setIsRecent(doc.isRecent)
					.setUUID(doc.uuid);
				posts.push(post);
			});
			resolve(posts);
		}).catch(function(e){
			reject(e);
		});
	});
}; //loadAll

Post.recentEdited = function(){
	return new Promise(function(resolve, reject){
		postDB.find({ isRecent: true }).sort({ regdate: -1 }).promise.exec()
		.then(function(docs){
			var posts = [];
			docs.forEach(function(doc){
				posts.push(new Post().setTitle(doc.title).setRegdate(doc.regdate));
			});
			resolve(posts);
		}).catch(function(e){
			reject(e);
		});
	});
}; //recentEdited

Post.delete = function(title){
	return new Promise(function(resolve, reject){
		postDB.promise.update( {title: title}, {$set: {isRecent: false}}, {multi: true} )
		.then(function(numReplaced){
			resolve();
		}).catch(function(e){
			reject(e);		
		});
	});
}; //delete

Post.titles = function(){
	return new Promise(function(resolve, reject){
		postDB.find({ isRecent: true })
		.sort({ title: 1 })
		.promise
		.exec()
		.then(function(docs){
			var titles = [];
			docs.forEach(function(doc){
				titles.push(doc.title);
			});
			resolve(titles);
		}).catch(function(e){
			reject(e);
		});
	});
}; //titles

Post.titleTree = function(){
	return new Promise(function(resolve, reject){
		var treeData = [];
		Post.titles().then(function(titles){
			titles.forEach(function(title){
				if(title.indexOf('/') < 0) {
					treeData.push({ text: title, data: '/Wiki/'+title+'/', icon: 'glyphicon glyphicon-file' });
					return;
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
			});
			resolve(treeData);
		});
	});
}; //titleTree
