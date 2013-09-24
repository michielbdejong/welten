module.exports = function(config, sockethub) {
  var twitter = require('twitter');
  if(sockethub) {
    sockethub.set('twitter', {
      credentials: config
    });
  }

  return {
  /*  stream: function(object, target, cb) {
      twit.stream(target, function(stream) {
        stream.on('data', cb);
        stream.on('end', function() { cb('end'); });
        stream.on('destroy', function() { cb('destroy'); });
      });
    },
    get: function(object, target, cb) {
      twit.get(target, {}, cb);
    },*/
    send: function(object, target, cb) {
      if(sockethub) {
        sockethub.sendObj({
          platform: 'twitter', verb: 'post',
          actor: { address: target }, target: [{ address: target }],
          object: { text: object }
        }, cb);
      } else {
        var twit = new twitter(config[target]);
        twit.updateStatus(object, cb);
      }
    }
  };
};
