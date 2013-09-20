if(process.argv.length != 3) {
  console.log('Usage: node welten.js path/to/data/dir');
  process.exit(1);
}

var fs = require('fs'),
  sockjs = require('sockjs'),
  mkdirp = require('mkdirp'),
  dataDir = process.argv[2],
  config, platforms = {}, clients = [];

if(dataDir.substr(-1)!='/') { dataDir += '/'; }
try {
  config = require(dataDir+'config.js')(dataDir);
} catch (e) {
  console.log('Please copy ./data-sample/ to '+dataDir+' to get started');
  process.exit(1);
}

// load platforms:
for(var i in config) {
  if(config[i] && i != 'dispatcher') {
    platforms[i]=require('./lib/'+i)(config[i]);
    if(typeof(platforms[i].on)=='function') {
      platforms[i].on('message', (function(p) {
        return function(msg) {
          if(msg.timestamp) {
            var dir = './data/inbox/'+p+'/'
              +msg.timestamp.toString().substring(0,4)+'/'
              +msg.timestamp.toString().substring(4,7)+'/';
            mkdirp(dir, function(err) {
              if(!err) {
                fs.writeFile(dir+msg.timestamp.toString().substring(7), JSON.stringify(msg));
              }
            });   
          }
          for(var j=0;j<clients.length;j++) {
            if(clients[j] && typeof(clients[j].write)=='function') {
              clients[j].write(JSON.stringify({platform: p, type: 'incoming', message: msg}));
            }
          }
        };
      })(i));
    }
    console.log('added platform: '+i);
  }
}
 
function dispatchCommand(obj, cb) {
  console.log('dispatching', obj);
  if((typeof(obj) != 'object') || (typeof(obj.target) != 'string')) {
    cb({error: 'obj.target should be a string', object: obj});
  } else {
    var platformAndTarget = obj.target.split(':');
    if(obj.token == config.dispatcher.token) {
      if(platforms[platformAndTarget[0]]) {
        if(platforms[platformAndTarget[0]][obj.verb])  {
          platforms[platformAndTarget[0]][obj.verb](obj.object, platformAndTarget[1], cb);
        } else {
          cb({error: 'cannot dispatch that', command: obj, verbs: platforms[platformAndTarget[0]]});
        }
      } else {
        cb({error: 'cannot dispatch that', command: obj, platforms: platforms});
      }
    } else {
      cb({error: 'cannot dispatch that', token: obj.token});
    }
  }
}

//set up webserver to bind WebSocket server to:
var webServer;
function serve(req, res) {
  res.writeHead(200);
  res.end('Welcome to sockethub welten. please connect a WebSocket to this port');
}
if(config.dispatcher.https) {
  webServer = require('https').createServer(config.dispatcher.https, serve);
} else {
  webServer = require('http').createServer(serve);
}
webServer.listen(config.dispatcher.port);

//set up WebSocket server to receive commands and call the `dispatch` function:
var sockServer = sockjs.createServer();
sockServer.on('connection', function(conn) {
  console.log('connected!');
  clients.push(conn);
  conn.on('data', function(chunk) {
    var obj;
    try { obj = JSON.parse(chunk); } catch(e) {}
    if(typeof(obj) == 'object') {
      dispatchCommand(obj, function(res) {
        console.log('writing back', res);
        conn.write(JSON.stringify(res));
      });
    } else {
      conn.write('what you sent is not JSON: '+chunk);
    }
  });
});
sockServer.installHandlers(webServer, { prefix: '/sock' });

console.log('Test if '
  +'http'+(config.dispatcher.https?'s':'')+'://localhost:'+config.dispatcher.port+'/ works, then point your unhosted web app to '
  +'ws'+(config.dispatcher.https?'s':'')+'://localhost:'+config.dispatcher.port+'/sock/websocket - your token is: '+config.dispatcher.token);
