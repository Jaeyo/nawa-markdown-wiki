var logger = require('../util/logger').getLogger(),
	uuid = require('node-uuid'),
	precondition = require('../util/precondition'),
	voteDb = require('../db/db').vote,
	precondition = require('../util/precondition'),
	util = require('util');
	
function Vote(){
	/*
	 *	{
	 *		uuid: (uuid),
	 *		regdate: (date),
	 *		title: (string),
	 *		candidates: [(string)],
	 *		votings[candidate(string)]: {
	 *			yesCount: (int),
	 *			noCount: (int),
	 *			opinions: [(string)],
	 *		}
	 *	}
	 */

	this.votings = {};
} //INIT

module.exports = Vote;

Vote.prototype = {
	setUUID: function(uuid){
		this.uuid = uuid;
		return this;
	}, //setUUID

	setRegdate: function(regdate){
		this.regdate = regdate;
		return this;
	}, //setRegdate

	setTitle: function(title){
		this.title = title;
		return this;
	}, //setTitle

	setCandidates: function(candidates){
		this.candidates = candidates;
		return this;
	}, //setCandidates

	addVoting: function(candidate, yesOrNo, opinion){
		try{
			precondition
				.check(this.candidates.indexOf(candidate) >= 0, util.format('invalid candidate: %s', candidate))
				.check(typeof yesOrNo === 'boolean', util.format('invalid yesOrNo: %s', yesOrNo))
				.check(opinion !== null, 'opinion is null');
		} catch(e){
			throw e;
		} //catch

		var voting = this.votings[candidate];
		if(voting === undefined)
			voting = { yesCount: 0, noCount: 0, opinions: [] };

		if(yesOrNo === true){
			voting.yesCount++;
		} else{
			voting.noCount++;
		} //if

		voting.opinions.push(opinion);

		this.votings[candidate] = voting;
		return this;
	} //addVoting
}; //Vote

Vote.save = function(vote){
	return new Promise(function(resolve, reject){
		try{
			precondition
				.check(vote.uuid !== undefined && vote.uuid !== null, 'uuid not exists')
				.check(vote.regdate !== undefined && vote.regdate !== null, 'regdate not exists')
				.check(vote.title !== undefined && vote.title !== null, 'title not exists')
				.check(vote.candidates !== undefined && vote.candidates !== null, 'candidates not exists');
		} catch(e){
			reject({err: e, filename: __filename, line: __line});
		} //catch

		if(vote.votings === undefined || vote.votings === null)
			vote.votings = {};
		
		voteDb.update({uuid: vote.uuid}, vote, {upsert: true}, function(err, numReplaced, upsert){
			if(err){
				reject({ err: err, filename: __filename, line: __line });
				return;
			} //if
			resolve();
		});
	});
}; //save

Vote.list = function(){
	return new Promise(function(resolve, reject){
		voteDb.find(null, function(err, docs){
			if(err){
				reject(JSON.stringify({ errmsg: 'while loading vote list', err: err, filename: __filename, line: __line }));
				return;
			} //if

			var votes = [];
			docs.forEach(function(doc){
				votes.push(newVoteFromDoc(doc));
			});
			resolve(votes);
		});
	});
}; //list

Vote.load = function(uuid){
	return new Promise(function(resolve, reject){
		voteDb.findOne({uuid: uuid}, function(err, doc){
			if(err){
				reject(JSON.stringify({ errmsg: 'while loading vote list', err: err, filename: __filename, line: __line }));
				return;
			} //if
			
			resolve(newVoteFromDoc(doc));
		});
	});
}; //load

function newVoteFromDoc(doc){
	var vote = new Vote()
		.setUUID(doc.uuid)
		.setRegdate(doc.regdate)
		.setTitle(doc.title)
		.setCandidates(doc.candidates);
	for(candidate in doc.votings){
		var docVoting = doc.votings[candidate];
		vote.votings[candidate] = {
			yesCount: docVoting.yesCount,
			noCount: docVoting.noCount,
			opinions: docVoting.opinions
		};
	} //for in votings
	return vote;
}; //newVoteFromDoc
