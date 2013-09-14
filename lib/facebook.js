var https = require('https'), 
    config = require('../data/config').facebook;

function doReq(method, path, payload, cb) {
  var req = https.request({
    host: 'graph.facebook.com',
    port: 443,
    path: path,
    method: method
  }, function (res) {
    var buffer = '';
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      console.log('adding chunk');
      buffer = buffer + chunk;
    });
    res.on('end', function () {
      var data;
      try {
        data = JSON.parse(buffer);
      } catch(err) {
        data = err;
      }
      cb(data);
    });
  });
  req.on('error', cb);
  req.end(payload);
}

module.exports = {
  get: function(object, target, cb) {
    doReq('GET', target+'?access_token=' + encodeURIComponent(config.access_token), null, cb);
  },
  post: function (object, target, cb) {
    doReq('POST', target+'?access_token=' + encodeURIComponent(config.access_token),
        'message=' + encodeURIComponent(object) + '&access_token=' + encodeURIComponent(config.access_token), cb);
  }
};
