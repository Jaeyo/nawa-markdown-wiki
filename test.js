var Post = require('./model/post');

var post = new Post();
post.setTitle('asdf').setContents('content').setRegdate(new Date());
console.log(post);