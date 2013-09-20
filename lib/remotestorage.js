module.exports = function(config) {
var url = require('url'),
  remoteStorage = require('../remotestorage-server')(config.dataDir);

function oauth(req, res) {
  remoteStorage.auth(url.parse(req.url, true).query, function(err, redirectUrl, preExisting) {
    res.writeHead(200, {
      'Content-Type': 'text/html'
    });
    res.write('<!DOCTYPE html lang="en"><head><title>'+config.host+'</title><meta charset="utf-8"></head><body><a href="'+redirectUrl+'">Allow</a></body>');
    if(preExisting) {
      res.write('<script>window.location='+redirectUrl+';</script>');
    }
    res.end('</html>');
  });
}

if(config.https) {
  require('https')
      .createServer(config.https, remoteStorage.serve)
      .listen(config.port1);
  require('https').createServer(config.https, oauth).listen(config.port2);
} else {
  require('http').createServer(remoteStorage.serve).listen(config.port1);
  require('http').createServer(oauth).listen(config.port2);
}
console.log("remoteStorage server started on 0.0.0.0:" + config.port1 + " and 0.0.0.0:" + config.port2);
  return {};
};
