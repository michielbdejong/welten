module.exports = function(config, sockethub) {
  var https = require('https'); 

  if(sockethub) {
    sockethub.sendObj({
      platform: 'facebook',
      verb: 'set',
      object: config
    });
  }

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

  return {
    get: function(object, target, cb) {
      doReq('GET', target+'?access_token=' + encodeURIComponent(config.access_token), null, cb);
    },
    post: function (object, target, cb) {
      if(sockethub) {
        sockethub.sendObj({
          platform: 'facebook', verb: 'post',
          actor: { address: target }, target: [{ address: target }],
          object: { text: object }
        }, cb);
      } else {
        doReq('POST', target+'?access_token=' + encodeURIComponent(config.access_token),
          'message=' + encodeURIComponent(object) + '&access_token=' + encodeURIComponent(config.access_token), cb);
       }
    }
  };
};
