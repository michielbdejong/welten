module.exports = function(config) {
  var https = require('https'),
  fs = require('fs');

  https.createServer(config.https, function(req, res) {
    if(req.method=='POST') {
      var str = '';
      req.on('data', function(chunk) {
        str += chunk;
      });
      req.on('end', function() {
        onMessage({
          timestamp: (new Date().getTime()),
          message: str
        });
        res.writeHead(202);
        res.end('Received, thank you!');
      });
    } else {
      res.writeHead(200);
      res.end('<!DOCTYPE html><html lang="en"><head><title>Post Me Anything</title><meta charset="utf-8" /></head><body style="background-color:#9090F0">\n'
        +'<h1>Post Me Anything</h1><form target="" method="post">\n'
        +'<textarea name="textarea" rows="10" cols="50">Write something here</textarea><br>\n'
        +'<input type="submit" value="Submit" />\n'
        +'</form></body></html>');
    }
  }).listen(7678);
  onMessage = function(msg) {
    console.log('no message handler for ', msg);
  }
  return {
    on: function(event, cb) {
      if(event=='message') {
        onMessage = cb;
      }
    }
  };
};
