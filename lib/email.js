var config = require('../data/config').email,
    sendgrid = require('sendgrid')(config.sendgrid.usr, config.sendgrid.pwd),
    Imap = require('imap'),
    imap = new Imap(config.imap),
    MailParser = require("mailparser").MailParser;

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
function onMessage(msg) { console.log('unhandled msg!', msg); };

module.exports = {
  on: function(eventType, handler) {
    if(eventType=='message') {
      onMessage = handler;
    }
  },
  send: function(object, target, cb) {
    sendgrid.send({
      subject: object.subject,
      text: object.text,
      to: target,
      toname: target,
      from: config.sendgrid.from,
      fromname: config.sendgrid.fromname,
      headers: {'in-reply-to': object.inReplyTo}
    }, function(err, result) {
     cb({err: err, result: result});
    });
  },
  fetch: function(object, target, cb) {//e.g. target=100, object=10
    var str = '';
    openInbox(function(err, box) {
      console.log('inbox open:', err, box);
      if (err) throw err;
      var f = imap.seq.fetch( (box.messages.total+1-target)+':'
                    + (object?(box.messages.total+1-target+object):'*'), { bodies: '' });
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
    });
  }
};
