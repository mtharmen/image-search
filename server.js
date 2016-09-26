var express = require('express');
require('dotenv').config({silent: true});
var mongoose = require('mongoose');
var Bing = require('node-bing-api')({ accKey: process.env.API_KEY });
var routes = require('./app/routes/searchApp.js');

var app = express();

app.use('/', express.static(__dirname + '/app/styles'));

// Document format
var historySchema = mongoose.Schema({
    term: String,
    when: String
});
var History = mongoose.model('History', historySchema);

// Establishing connection to database
mongoose.connect('mongodb://' + process.env.IP + '/image-search');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log('Connected to image-search');
    
    routes(app, Bing, History);
});

var port = process.env.PORT || 8080;
app.listen(port, function() {
    console.log('Listening on port', port);
});

// Closes database when node server.js stops
process.on('SIGINT', function() {  
  mongoose.connection.close(function () { 
    console.log('Closing connection to mongoose database'); 
    process.exit(0); 
  }); 
}); 

