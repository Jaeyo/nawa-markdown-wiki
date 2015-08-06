Model = function(){
	this.title = $('#hidden-post-title').val();
}; //INIT
Model.prototype = {
}; //Model

View = function(){
}; //INIT
View.prototype = {
	init: function(){
		hljs.initHighlightingOnLoad();

		console.log('cp1');//DEBUG
		$('.contents table').each(function(index, value){
			console.log(value);//DEBUG
			$(value).addClass('table table-striped table-bordered');
		});
		console.log('cp2'); //DEBUG
	} //init
}; //View

Controller = function(){
	this.model = new Model();
	this.view = new View();
}; //INIT
Controller.prototype = {
	deletePost: function(){
		bootbox.confirm('delete ' + this.model.title, function(result){
			$.delete('/Wiki/', { param: JSON.stringify({title: controller.model.title}) })
			.done(function(resp){
				if(resp.success !== 1){
					bootbox.alert(JSON.stringify(resp));
					return;
				} //if
				
				bootbox.alert('deleted', function(){
					window.location.href = '/Wiki/';
				});
			});
		});
	} //deletePost
}; //Controller

$(function(){
	controller = new Controller();
	controller.view.init();
});
