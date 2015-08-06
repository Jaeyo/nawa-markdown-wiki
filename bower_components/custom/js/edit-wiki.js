Model = function(){
}; //INIT
Model.prototype = {
}; //Model

View = function(){
	this.simplemde = new SimpleMDE( {element: $('textarea')[0]} );
	this.simplemde.render();
}; //INIT
View.prototype = {
}; //View

Controller = function(){
	this.model = new Model();
	this.view = new View();
}; //INIT
Controller.prototype = {
	post: function(){
		var title = $('.contents h1').text();
		var contents = this.view.simplemde.value();
		$.post('/Wiki/', { param: JSON.stringify({title: title, contents: contents}) })
		.done(function(resp){
			if(resp.success !== 1){
				bootbox.alert(JSON.stringify(resp))
				return;
			} //if

			window.location.href = '/Wiki/{}/'.format(title);
		});
	} //post
}; //Controller

$(function(){
	controller = new Controller();
});
