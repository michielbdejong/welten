module.exports = function(config) {
  var sendgrid,
    Imap = require('imap'),
    imap = new Imap(config.imap),
    MailParser = require("mailparser").MailParser;

  function fetch(object, target, cb) {//e.g. target=100, object=10
    if(!box) {
      return cb('box not ready');
    }
    var str = '';
    var f = imap.seq.fetch( (box.messages.total+1-target)+':'
                  + (object?(box.messages.total-target+object):'*'), { bodies: '' });
    f.on('end', cb);
    f.on('message', function(msg, seqno) {
      console.log('got message', seqno);
      msg.on('body', function(stream, info) {
        console.log('got body, piping stream into parser', seqno);
        var mailparser = new MailParser();
        stream.pipe(mailparser);
        mailparser.on("end", function(mailObject){
          console.log('parsed', mailObject, seqno);
          onMessage({
            timestamp: new Date(mailObject.headers.date).getTime(),
            actor: mailObject.from,
            target: {
              to: mailObject.to,
              cc: mailObject.cc,
              bcc: mailObject.bcc
            },
            object: mailObject
          });
        });
      });
    });
  }
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
    imap.once('mail', function(num) {
      console.log('you got mail! num:'+num);
      fetch(1, 1, function() {
        console.log('fetched');
      });
    });
    imap.once('end', function() {
      console.log('once - end');
      console.log('Connection ended');
    });
    console.log('connect start');
    imap.connect();
    console.log('connect synchronously done');
  }
  function onMessage(msg) { console.log('unhandled msg!', msg); };

  //...
  try {
    sendgrid = require('sendgrid')(config.sendgrid.user, config.sendgrid.password);
  } catch(e) {
    console.log('sendgrid not configured');
  }
  var box;
  openInbox(function(err, setBox) {
    console.log('inbox open:', err, setBox);
    if (err) throw err;
    box = setBox;
  });
  return {
    on: function(eventType, handler) {
      if(eventType=='message') {
        onMessage = handler;
      }
    },
    send: function(object, target, cb) {
      sendgrid.send({
        subject: object.subject,
        text: object.text,
        to: target.to,
        cc: target.cc,
        bcc: target.bcc,
        from: config.sendgrid.from,
        fromname: config.sendgrid.fromname,
        headers: {'in-reply-to': object.inReplyTo}
      }, function(err, result) {
       cb({err: err, result: result});
      });
    },
    fetch: fetch,
  };
};
