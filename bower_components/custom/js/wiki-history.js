Model = function(){
}; //INIT
Model.prototype = {
}; //Model

View = function(){
}; //INIT
View.prototype = {
}; //View

Controller = function(){
	this.model = new Model();
	this.view = new View();
}; //INIT
Controller.prototype = {
	diff: function(){
		var leftChecked = $('input[type="radio"][name="left"]:checked').val();
		var rightChecked = $('input[type="radio"][name="right"]:checked').val();
		
		if(leftChecked === null || rightChecked === null){
			bootbox.alert('radio box unchecked');
			return;
		} //if
		
		if(leftChecked === rightChecked){
			bootbox.alert('cannot diff with same archive');
			return;
		} //if
		
		window.location.href='/WikiDiff/{}/{}/'.format(leftChecked, rightChecked);
	} //diff
}; //Controller

$(function(){
	controller = new Controller();
});