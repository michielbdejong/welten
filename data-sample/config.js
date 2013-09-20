//var fs = require('fs');
module.exports = function(dataDir) {
  return {
    dispatcher: {
      port: 4272,
      token: '...',
      //this will cause it to open a secure WebSocket (wss://), leave it out to get a standard/insecure one (ws://):
//      https: {
//        key: fs.readFileSync(dataDir+'tls/tls.key'), 
//        cert: fs.readFileSync(dataDir+'tls/tls.cert'), 
//        ca: fs.readFileSync(dataDir+'tls/chain.pem'),
//      },
    },
//    facebook: {
//      access_token: '...',
//    },
//    google: {
//      client_id: '...',
//      client_secret: '...',
//      redirect_uri: '...',
//      access_token: '...',//obtain from OAuth2 code using 'allow' button in August app, and then 'set' verb
//    },
//    twitter: {
//      '@handle': {
//        consumer_key: '...',
//        consumer_secret: '...',
//        access_token_key: '...',
//        access_token_secret: '...',
//      },
//    },
//    irc: {
//      host: 'irc.freenode.net',
//      nick: '...',
//      channels: ['#welten'],
//    },
//    email: {
//      sendgrid: {
//        usr: '...',
//        pwd: '...',
//        from: '...@...',
//        fromname: '... ...',
//      },
//      imap: {
//        user: '...',
//        password: '...',
//        host: '...',
//        port: 993,
//        tls: true,
//        tlsOptions: { rejectUnauthorized: false },
//      }
//    },
    remotestorage: {
//      https: {
//        key: fs.readFileSync(dataDir+'tls/tls.key'),
//        cert: fs.readFileSync(dataDir+'tls/tls.cert'),
//        ca: fs.readFileSync(dataDir+'tls/chain.pem'),
//      },
      port1: 8012,
      port2: 8013,
      password: '...',
      dataRoot: dataDir,
    },
    www: {
      contentDir: dataDir+'public_html/',
      portOffset: 7000, //will result in ports 7080 (and 7443) instead of 80 (and 443)
//      https: {
//        key: fs.readFileSync(dataDir+'tls/tls.key'),
//        cert: fs.readFileSync(dataDir+'tls/tls.cert'),
//        ca: fs.readFileSync(dataDir+'tls/chain.pem')
//      },
    },
  };
};
