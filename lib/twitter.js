var config = require('../data/config').twitter,
    twitter = require('twitter');

module.exports = {
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
    var twit = new twitter(config[target]);
    twit.updateStatus(object, cb);
  }
};
