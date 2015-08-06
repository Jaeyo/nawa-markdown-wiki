var Datastore = require('nedb');

var postDB = new Datastore({ filename: 'data/post.db' });
postDB.loadDatabase(function(err){
    if(err) throw err;
});

exports.postDB = postDB;