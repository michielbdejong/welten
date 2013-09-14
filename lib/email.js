var SendGrid = require('sendgrid'),
    config = require('../data/config').email,
    sendgrid = new SendGrid(config.sendgrid.usr, config.sendgrid.pwd),
    Imap = require('imap'),
    imap = new Imap(config.imap),
    inspect = require('util').inspect;

function openInbox(cb) {
  console.log('openInbox', config.imap);
  imap.once('ready', function() {
    console.log('once - ready');
    imap.openBox('INBOX', true, cb);
  });

  imap.once('error', function(err) {
    console.log('once - ready');
    console.log(err);
  });

  imap.once('end', function() {
    console.log('once - end');
    console.log('Connection ended');
  });
  console.log('connect start');
  imap.connect();
  console.log('connect synchronously done');
}
function onMessage() {};

module.exports = {
  on: function(eventType, handler) {
    if(eventType=='message') {
      onMessage = handler;
    }
  },
  send: function(object, target, cb) {
    var obj = {
      subject: object,
      text: object,
      to: target,
      toname: target,
      from: config.sendgrid.from,
      fromname: config.sendgrid.fromname
    };
    sendgrid.send(obj, function(err, result) {
     cb({params: obj, err: err, result: result});
    });
  },
  fetchHeaders: function(object, target, cb) {//e.g. target=100, object=10
    var str = '';
    openInbox(function(err, box) {
      console.log('inbox open:', err, box);
      if (err) throw err;
      var f = imap.seq.fetch( (box.messages.total-target)+':'
                            //+ (box.messages.total-target+object), {
                            +'*', {
        bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
        struct: true
      });
      f.on('message', function(msg, seqno) {
        console.log('Message #%d', seqno);
        var prefix = '(#' + seqno + ') ';
        msg.on('body', function(stream, info) {
          var buffer = '';
          stream.on('data', function(chunk) {
            buffer += chunk.toString('utf8');
          });
          stream.once('end', function() {
            console.log(prefix + 'Parsed header: %s', inspect(Imap.parseHeader(buffer)));
            var obj = Imap.parseHeader(buffer);
            onMessage({
              timestamp: new Date(obj.date).getTime(),
              actor: obj.from,
              target: obj.to,
              object: obj.subject
            });
          });
        });
        msg.once('attributes', function(attrs) {
          console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
        });
        msg.once('end', function() {
          console.log(prefix + 'Finished');
        });
      });
    });
  },
  fetchItem: function(object, target, cb) {
    var itemNo = target, str = '';
    openInbox(function(err, box) {
      console.log('inbox open:', err, box);
      var f = imap.seq.fetch(box.messages.total + ':*', { bodies: ['HEADER.FIELDS (FROM)','TEXT'] });
      f.on('message', function(msg, seqno) {
        console.log('Message #%d', seqno);
        var prefix = '(#' + seqno + ') ';
        msg.on('body', function(stream, info) {
          if (info.which === 'TEXT')
            console.log(prefix + 'Body [%s] found, %d total bytes', inspect(info.which), info.size);
          var buffer = '', count = 0;
          stream.on('data', function(chunk) {
            count += chunk.length;
            buffer += chunk.toString('utf8');
            if (info.which === 'TEXT')
              console.log(prefix + 'Body [%s] (%d/%d)', inspect(info.which), count, info.size);
          });
          stream.once('end', function() {
            if (info.which !== 'TEXT')
              console.log(prefix + 'Parsed header: %s', inspect(Imap.parseHeader(buffer)));
            else
              console.log(prefix + 'Body [%s] Finished', inspect(info.which));
            cb(buffer);
          });
        });
        msg.once('attributes', function(attrs) {
          console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
        });
        msg.once('end', function() {
          console.log(prefix + 'Finished');
        });
      });
    });
  }
};
