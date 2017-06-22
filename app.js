'use strict';
var dotenv = require('dotenv');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var useragent = require('express-useragent');
var request = require('request');
var async = require("async");

var schema = require('./app/schema').schema;

dotenv.load();
var root_url = process.env.ROOT_URL;
var port = Number(process.env.PORT);

/******************************** EXPRESS SETUP *******************************/

var app = express();
app.set('json spaces', 2);
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(useragent.express());

app.get('/', function (req, res) {

  async.waterfall([
  	function(callback) {
      request({
        uri: 'https://www.facebook.com/platform/api-status/',
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.81 Safari/537.36'
        }
      }, function (error, response, body) {
        var fbStatus = JSON.parse(response.body);
        schema.social_networks.facebook.status = (fbStatus.current.health || 0 );
        schema.social_networks.facebook.response = (fbStatus || null )
        console.log(fbStatus);
        callback(null, fbStatus);
      });
  	},
		function(fbStatus, callback) {

      request({
        uri: 'https://status.github.com/api/status.json',
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.81 Safari/537.36'
        }
      }, function (error, response, body) {
        var githubStatus = JSON.parse(response.body);
				console.log('githubStatus', githubStatus);
        schema.platforms.github.status = (githubStatus.status === 'good') ? 1 : 0;
        schema.platforms.github.response = (githubStatus || null )

        //callback(null, githubStatus);
				callback(null, 'githubStatus');
      });

  	}
  ], function (err, result) {
      res.json( schema );
  });
});


/******************************** SERVER LISTEN *******************************/

// Server Listen
app.listen( port, function () {
	console.log( '\nApp server is running on ' + root_url +':' + port + '\n' );
});
