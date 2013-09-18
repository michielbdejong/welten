var static = require('node-static'),
    config = require('../data/config').www,
    file = new static.Server(config.contentDir, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'If-Match, If-None-Match',
        'Access-Control-Expose-Headers': 'ETag, Content-Type, Content-Length'
      }
    });

function serve (request, response) {
  request.addListener('end', function () { file.serve(request, response); }).resume();
}

require('http').createServer(serve).listen(8080);
if(config.https) {
  require('https').createServer(config.https, serve).listen(4430);
}
