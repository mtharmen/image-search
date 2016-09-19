var express = require('express');
var validUrl = require('valid-url');
var mongo = require('mongodb').MongoClient;

var app = express();

function generateCode() {
    return Math.floor(1000 + Math.random() * 10000).toString();
}

function checkDB(collection, filter, callback) {
    collection.find(filter, { original: 1, mini: 1, _id: 0 }).limit(1).toArray(function(err, documents) {
        if (err) throw err;
    
        // Searching for URL
        if ('original' in filter) {  
            if (documents.length) {
                var entry = { original: documents[0].original, mini: documents[0].mini };
                console.log('Entry found: ' + JSON.stringify(entry));
                callback(entry);
            } else {
                console.log('Entry not found, creating new entry...');
                callback( newEntry(collection, filter.original) );
            }
        } 
        
        // Searching for code
        else if ('mini' in filter) { 
            if (documents.length) {
                console.log('Code found');
                var originalURL = documents[0].original;
                callback(originalURL);
            } else {
                console.log('Code not found');
                callback({ error: 'Code not Found' });
            }
        } 
        
        else {
            console.log('Should not be here...');
        }
    });
}

function newEntry(collection, url) {
    var code = generateCode().toString();
    var newLink = { original: url, mini: code };
    
    collection.insert(newLink, function(err, doc) {
        if (err) throw err;
        console.log('Added new entry: ' + JSON.stringify(newLink));
    });
    return newLink;
}



app.use('/', express.static(__dirname + '/styles'));
app.use('/new', express.static(__dirname + '/styles'));

app.get('/new/:url(*)', function(req, res){
    
    var inputURL = req.params.url;
    
    if (!validUrl.isUri(inputURL)){
        res.json({error: 'Invalid url format, see main page for correct format'});
    } else {
        
        mongo.connect('mongodb://localhost:27017/url-shortener', function(err, db) {
            if (err) throw err;
            else { console.log('Connected to url-shortener.'); }
            
            var linksDB = db.collection('links');
            
            
            // Checking if entry already exists
            console.log('Beginning search');
            checkDB(linksDB, { original: inputURL }, function(message) {
                res.json(message);
                db.close();
            });
        });
    }
});


app.get('/:code(*)', function(req, res){
    
    var code = req.params.code;
    
    if (!(code.match(/^\d+$/))){
        res.json({error: 'Invalid code format, see main page for correct format'});
    } else {
        
        mongo.connect('mongodb://localhost:27017/url-shortener', function(err, db) {
            if (err) throw err;
            else { console.log('Connected to url-shortener.'); }
            
            var linksDB = db.collection('links');
            
            
            // Checking if entry already exists
            console.log('Beginning search');
            checkDB(linksDB, { mini: code }, function(message) {
                if (typeof message === 'string') {
                    console.log('Redirecting to ' + message);
                    res.redirect(message);
                } else {
                    res.json(message);
                }
                
                db.close();
            });
        });
    }
});


app.listen(8080, function() {
    console.log('Listening on port 8080');
})