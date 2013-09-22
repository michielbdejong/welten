module.exports = function(config) {
var url = require('url'),
  querystring = require('querystring'),
  remoteStorage = require('../remotestorage-server')(config.dataRoot);

function displayForm(req, res, errorMsg) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<!DOCTYPE html><html lang="en"><head><title>'+config.host+'</title><meta charset="utf-8"></head><body>'
   +'<form method="POST">Password:<input type="password" name="pwd" /></form>'
   +'</body></html>');
}

function oauth(req, res) {
  if(req.method=='POST') {
    var str = '';
    req.on('data', function(chunk) {
      str += chunk;
    });
    req.on('end', function() {
      console.log(str);
      if(querystring.parse(str).pwd==config.password) {
        remoteStorage.auth(url.parse(req.url, true).query, function(err, redirectUrl, preExisting) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.write('<!DOCTYPE html><html lang="en"><head><title>'+config.host+'</title><meta charset="utf-8"></head><body><a href="'+redirectUrl+'">Allow</a></body>');
          if(preExisting) {
            res.write('<script>window.location='+redirectUrl+';</script>');
          }
          res.end('</html>');
        });
      } else {
        displayForm(req, res, 'wrong password!');
      }
    });
  } else {
    displayForm(req, res);
  }
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
