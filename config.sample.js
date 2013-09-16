var fs = require('fs');
module.exports = {
  dispatcher: {
    port: 4272,
    token: '...',
    //this will cause it to open a secure WebSocket (wss://), leave it out to get a standard/insecure one (ws://):
    https: {
      key: fs.readFileSync('./data/tls/tls.key'), 
      cert: fs.readFileSync('./data/tls/tls.cert'), 
      ca: fs.readFileSync('./data/tls/chain.pem')
    }
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
    },
    port: 8012,
    password: '...'
  },
  www: {
    contentDir: './data/public_html',
    //this will cause it to listen on port 443 as well, leave it out for just port 80:
    https: {
      key: fs.readFileSync('./data/tls/tls.key'),
      cert: fs.readFileSync('./data/tls/tls.cert'),
      ca: fs.readFileSync('./data/tls/chain.pem')
    }
  }
};
