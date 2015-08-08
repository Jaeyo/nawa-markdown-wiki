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

		$('.contents table').each(function(index, value){
			console.log(value);//DEBUG
			$(value).addClass('table table-striped table-bordered');
		});
	}, //init
	sendToSlackDOM: function(){
		var dom = '';
		dom += '<div class="input-group input-group-sm">';
		dom += 		'<span class="input-group-addon">channel</span>';
		dom += 		'<input id="text-slack-channel" type="text" class="form-control" placeholder="#random">';
		dom += '</div>';
		dom += '<div class="input-group input-group-sm">';
		dom += 		'<span class="input-group-addon">message</span>';
		dom += 		'<input id="text-slack-message" type="text" class="form-control" />';
		dom += '</div>';
		return dom;
	} //sendToSlackDOM
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
	}, //deletePost
	sendToSlack: function(){
		var title = $('h1.header-title').text();
		bootbox.dialog({
			title: 'send to slack',
			message: controller.view.sendToSlackDOM(),
			buttons: {
				success: {
					label: 'send',
					className: 'btn-success',
					callback: function(){
						var param = {
							title: $('h1.header-title').text(),
							channel: $('#text-slack-channel').val(),
							msg: $('#text-slack-message').val()
						};
						$.post('/Export/Slack', { param: JSON.stringify(param) }).done(function(resp){
							if(resp.success != 1){
								bootbox.alert(JSON.stringify(resp));
								return;
							} //if
							bootbox.alert('success');
						});
					} //callback
				} //success
			} //buttons
		});
	} //sendToSlack
}; //Controller

$(function(){
	controller = new Controller();
	controller.view.init();
});
