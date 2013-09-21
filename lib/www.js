module.exports = function(config) {
var static = require('node-static'),
    file = new static.Server(config.contentDir, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'If-Match, If-None-Match',
        'Access-Control-Expose-Headers': 'ETag, Content-Type, Content-Length'
      }
    });

function serve (request, response) {
//  if(request.url.substring(0, '/.well-known/webfinger'.length)=='/.well-known/webfinger') {
//    require('fs').readFile(config.contentDir+'/.well-known/webfinger', function(err, data) {
//      response.writeHead(200, {
//        'Access-Control-Allow-Origin': '*',
//        'Content-Type': 'application/json; charset=utf-8'
//      });
//      response.end(data);
//    });
//  } else {
    request.addListener('end', function () { file.serve(request, response); }).resume();
//  }
}

require('http').createServer(serve).listen(80+config.portOffset);
if(config.https) {
  require('https').createServer(config.https, serve).listen(443+config.portOffset);
}
  return {};
};
