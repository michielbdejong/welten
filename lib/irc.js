module.exports = function(config) {
  var irc = require('irc');
  var client = new irc.Client(config.host, config.nick, {channels: config.channels}),
    onMessage = function(msg) {
      console.log('no client connected', msg);
    };
  console.log(config.host, config.nick, {channels: config.channels});
  client.addListener('message', function (from, to, message) {
      console.log('irc message listener from ' + from + ' => ' + to + ': ' + message);
      onMessage({
        actor: from,
        target: to,
        object: message
      });
  });

  return {
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
};
