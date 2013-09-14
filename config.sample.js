var fs = require('fs');
module.exports = {
  dispatcher: {
    https: {
      key: fs.readFileSync('./data/tls/tls.key'), 
      cert: fs.readFileSync('./data/tls/tls.cert'), 
      ca: fs.readFileSync('./data/tls/chain.pem')
    },
    port: 4272,
    token: '...',
  },
  facebook: {
    access_token: '...'
  },
  google: {
    client_id: '...',
    client_secret: '...',
    redirect_uri: '...',
    access_token: '...',//obtain from OAuth2 code using 'allow' button in August app, and then 'set' verb
  },
  twitter: {
    '@handle': {
      consumer_key: '...',
      consumer_secret: '...',
      access_token_key: '...',
      access_token_secret: '...'
    }
  },
  irc: {
    host: 'irc.freenode.net',
    nick: '...',
    channels: ['#welten']
  },
  email: {
    sendgrid: {
      usr: '...',
      pwd: '...',
      from: '...@...',
      fromname: '... ...',
    },
    imap: {
      user: '...',
      password: '...',
      host: '...',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    }
  },
  remotestorage: {
    https: {
      key: fs.readFileSync('./data/tls/tls.key'),
      cert: fs.readFileSync('./data/tls/tls.cert'),
      ca: fs.readFileSync('./data/tls/chain.pem')
    }
    port: 8012,
    password: '...'
  },
  www: {
    port: 8080,//i'm running this as http behind a https-offloading proxy.
               //but if you want run it as https directly, edit the file lib/www.js
               //and make it more like lib/remotestorage.js, should be trivial
    contentDir: './data/public_html'
  }
};
