'use strict';

module.exports = function(app, Bing, History) {
    app.get('/imagesearch/:terms', function(req, res){
        
        // Search
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
};