exports.check = function(exp, errmsg){
	if(exp !== true)
		throw new Error(errmsg);
	return this;
}; //check
