var irc = require('irc'),
  config = require('../data/config').irc;
var client = new irc.Client(config.host, config.nick, {channels: config.channels}),
  onMessage = function(msg) {
    console.log('no client connected', msg);
  };
console.log(config.host, config.nick, {channels: config.channels});
client.addListener('message', function (from, to, message) {
    onMessage(from + ' => ' + to + ': ' + message);
});

module.exports = {
  join: function(object, target, cb) {
    console.log('joining '+target);
   client.join(target);
  },
  part: function(object, target, cb) {
    console.log('parting '+target);
   client.part(target);
  },
  send: function(object, target, cb) {
    console.log('saying '+object+' to '+target);
   client.say(target, object);
  },
  on: function(eventType, cb) {
    if(eventType=='message') {
      onMessage = cb;
    }
  }
};
