var express = require('express');
require('dotenv').config({silent: true});
var mongoose = require('mongoose');
var Bing = require('node-bing-api')({ accKey: process.env.API_KEY });

var app = express();
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
    
    app.use('/', express.static(__dirname + '/styles'));
    
    // Search
    app.get('/imagesearch/:terms', function(req, res){
        
        var searchTerm = req.params.terms;
        var page = req.query.page || 10; // Number of results per page, default to 10
        var offset = req.query.offset*page || 0; // Skip number results by page, default to 0
        
        Bing.images(searchTerm, {top: page, skip: offset}, function(err, response, body){
            if (err) return console.error(err);
            
            var images = body.d.results;
            
            // Filtering out excess data
            var printStuff = images.map(function(obj){ 
                return {
                    url: obj.MediaUrl, 
                    snippet: obj.Title,
                    thumbnail : obj.Thumbnail.MediaUrl,
                    context: obj.SourceUrl
                };
            });

            // Saving to database
            var d = new Date();
            var newTerm = new History({ term: searchTerm, when: d.toISOString() });
            newTerm.save(function (err, newTerm) {
              if (err) return console.error(err);
              console.log('Added new search ' + JSON.stringify({term: newTerm.term, when: newTerm.when}));
            });
            
            res.set('Content-Type', 'text/plain').status(200);
            res.json(printStuff);
        });
        
    });
    
    // History
    app.get('/history', function(req, res){
        
        // Filtering out _id, keeping term, when
        var query = History.find({}).select('term when -_id');
        
        query.exec(function (err, past) {
            if (err) return console.error(err);
            
            res.set('Content-Type', 'text/plain').status(200);
            res.json(past);
        });
    });
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

