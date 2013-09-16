var static = require('node-static'),
    config = require('../data/config').www,
    file = new static.Server(config.contentDir);

function serve (request, response) {
  request.addListener('end', function () { file.serve(request, response); }).resume();
}

require('http').createServer(serve).listen(80);
if(config.https) {
  require('https').createServer(config.https, serve).listen(443);
}