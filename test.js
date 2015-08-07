var Promise = require('songbird'),
    Post = require('./model/post'),
    postDB = require('./db/db').postDB;
    
function loadHistory(title){
    return new Promise(function(resolve, reject){
       postDB.find({ title: title })
       .sort({ regdate: -1 })
       .promise
       .exec()
       .then(function(docs){
           resolve(docs);
       }).catch(function(e){
           reject(e);
       });
    });
}; //loadHistory

// var post = new Post()
//                 .setTitle('woeifjaosidf')
//                 .setContents('wefwef')
//                 .setIsRecent(true)
//                 .setRegdate(new Date())
//                 .setUUID('asdf');


loadHistory('woeifjaosidf').then(function(docs){
    console.log(docs);
}).catch(function(e){
    console.log(e);
})