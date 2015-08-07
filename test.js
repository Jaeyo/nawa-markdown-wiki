var postDB = require('./db/db').postDB,
    jsdiff = require('diff'),
    Post = require('./model/post');

var leftUUID = '1f4f96ea-2f12-47b8-a911-0fedd372fe2e';
var rightUUID = 'a5d25782-7276-4191-952b-c8d2eef23a7e';

Promise.all([ Post.loadByUUID(leftUUID), Post.loadByUUID(rightUUID) ])
.then(function(args){
    var leftPost = args[0];
    var rightPost = args[1];
 
    var result = jsdiff.diffLines(leftPost.contents, rightPost.contents);
    result.forEach(function(line){
       if(line.added){
           console.log('added: ' + line.value);
       } else if(line.removed){
           console.log('removed: ' + line.value);
       } else{
           console.log(line.value);
       } //if
    });
});