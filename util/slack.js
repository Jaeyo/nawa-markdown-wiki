var Slack = require('slack-node'),
	Promise = require('songbird'),
	conf = require('./conf');

var slack = new Slack();
slack.setWebhook(conf.slackWebhookUri);

exports.sendToSlack = function(channel, msg){
	return new Promise(function(resolve, reject){
		slack.promise.webhook({
			channel: channel,
			username: 'nawa-wiki',
			text: msg
		}).then(function(resp){
			if(resp.status != 'ok'){ reject(JSON.stringify({resp: resp, channel: channel, msg: msg})); return; }
			resolve(resp);
		}).catch(function(e){
			reject(e);
		});
	});
}; //sendToSlack