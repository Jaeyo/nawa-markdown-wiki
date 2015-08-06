exports.endsWith = function(str, suffix){
	return str.indexOf(suffix, str.length - suffix.length) !== -1;
}; //endsWith

exports.replaceAll = function(str, searchStr, replaceStr){
	return str.split(searchStr).join(replaceStr);
}; //replaceAll
