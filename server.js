var express = require('express');
var mongo = require('mongodb').MongoClient;
var Bing = require('node-bing-api')({ accKey: "" });

var app = express();

function addSearch(str) {
    mongo.connect('mongodb://localhost:27017/image-search', function(err, db) {
        if (err) throw err;
        else { console.log('Connected to image-search'); }
        
        var pastSearch = db.collection('pastSearch');
        var d = new Date();
        var newTerm = { term: str, when: d.toISOString() };
        pastSearch.insert(newTerm, function(err, doc) {
            if (err) throw err;
            
            console.log('Added new search ' + JSON.stringify(newTerm));
        });
        db.close();
    });
}

function getPast(callback) {
    mongo.connect('mongodb://localhost:27017/image-search', function(err, db) {
        if (err) throw err;
        else { console.log('Connected to image-search'); }
        
        var pastSearch = db.collection('pastSearch');
        
        var searchList = [];
        
        pastSearch.find({}, { term: 1, when: 1, _id: 0 }).toArray(function(err, doc) {
            if (err) throw err;
            
            for (var i=0; i < doc.length; i++) {
                searchList.push({ term: doc[i].term, when: doc[i].when });
            }
            callback(searchList);
        });
    });
}

app.use('/', express.static(__dirname + '/styles'));

app.get('/api/imagesearch/:terms', function(req, response){
    
    var term = req.params.terms.split('?')[0];
    //var term ="Ninja Turtles";
    //var offset = req.params.terms.split('?')[1];
    
    
    
    Bing.images(term, {top: 5}, function(err, res, body){
        if (err) throw err;
        
        var images = body.d.results;

        var printStuff = [];
        
        for (var i=0; i < images.length; i++) {
            printStuff.push({ 
                url: images[i].MediaUrl, 
                snippet: images[i].Title,
                thumbnail : images[0].Thumbnail.MediaUrl,
                context: images[0].SourceUrl
            });
        }
        addSearch(term);
        response.send(printStuff);
    });
    
});


app.get('/api/latest/imagesearch', function(req, res){
    
    getPast(function(searchList) {
        res.send(searchList);
    });
    
});


app.listen(8080, function() {
    console.log('Listening on port 8080');
})