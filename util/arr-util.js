var js_cols = require('js_cols');

exports.removeDuplicate = function(arr){
	var set = new js_cols.HashSet();
	set.insertAll(arr);
	arr = [];
	set.forEach(function(value){
		arr.push(value);
	});
	return arr;
}; //removeDuplicate
