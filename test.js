var postDB = require('./db/db').postDB,
    uuid = require('node-uuid'),
	util = require('util');

postDB.find({}, function(err, docs){
	docs.forEach(function(doc){
		if(doc.uuid === undefined){
			console.log(util.format('%s uuid undefined', doc.title));
			postDB.update({ _id: doc._id }, { $set: { uuid: uuid.v4() } }, {}, function(){});
		} //if
	});
});


