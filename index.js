var express = require("express");
var app = express();
var bodyParser = require('body-parser');
var request = require('request');

app.use(bodyParser.json());

app.post("/*", function(req, res) {
	var body = req.body;
	var payload;
	var post = {};
	if (body.user_name) { //gitlab
		payload = body.user_name + " just triggered a " + body.object_kind + " event on " + body.project.name + ".\n";
		if (body.commits && body.commits.length > 0) {
			payload += "Commits: \n";
			body.commits.forEach(function(commit) {
				payload += "[" + commit.message + "]";
				payload += "(" + commit.url + ")\n";
			});
		}
	} else if (body.actor) { //bitbucket
		if (body.push) {
			payload = body.actor.display_name + " just triggered a push event on " + body.repository.name;
			if (body.push.changes[0].commits && body.push.changes[0].commits.length > 0) {
				payload += " on branch " + body.push.changes[0].new.name + ".\n";
				body.push.changes[0].commits.forEach((commit) => {
					payload += "[" + commit.message + "]";
					payload += "(" + commit.links.html.href + ")\n";
				});
			}
		}
	} else if (body.by) { //taiga
		payload = "[" + body.by.full_name + "](" + body.by.permalink + ") just did a " + body.action + " on a " + body.type + " called \n**\"" + body.data.subject + "\"** ";
		if (body.data.user_story) {
			payload += "\nOn user-story called **\"" + body.data.user_story.subject + "\"** ";
		}
		if (body.change) {
			payload += "\nFrom **\"" + body.change.diff.status.from + "\"** to **\"" + body.change.diff.status.to + "\"** ";
		}
		if (body.data.milestone) {
			payload += "\nOn [" + body.data.milestone.name + "](" + body.data.project.permalink + "/taskboard/" + body.data.milestone.slug + ") ";
		}
	}
	if (body.extra) {
		payload = payload.trim() + "\n" + body.extra;
	}
	post.url = "https://discordapp.com/api/webhooks" + req.originalUrl;
	post.headers = {
		"content-type": "application/json"
	};
	post.body = JSON.stringify({
		"content": payload
	});
	request.post(post, function(err, resp, body) {
		res.send(resp.statusCode);
	});
});

app.listen(process.env.PORT || 8080);
