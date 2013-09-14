var sockjs = require('sockjs'),
    fs = require('fs'),
    config = require('./data/config').dispatcher,
    platforms = {};

//require all platforms from `lib/`:
fs.readdir('./lib/', function(err, data) {
  var i, platform, clients=[];
  if(!err) {
    for(i=0; i<data.length; i++) {
      platform =data[i].substring(0, data[i].length-3);
      platforms[platform]=require('./lib/'+platform);
      if(typeof(platforms[platform].on)=='function') {
        platforms[platform].on('message', (function(p) {
          return function(msg) {
            for(var j=0;j<clients.length;j++) {
              if(clients[j] && typeof(clients[j].write)=='function') {
                clients[j].write(JSON.stringify({platform: p, type: 'incoming', message: msg}));
              }
            }
          };
        })(platform));
      }
      console.log('added platform: '+platform);
    }
  }
  
  //the core function that dispatches a command to a platform:
  function dispatch(obj, cb) {
    console.log('dispatching', obj);
    if((typeof(obj) != 'object') || (typeof(obj.target) != 'string')) {
      cb({error: 'obj.target should be a string', object: obj});
    } else {
      var platformAndTarget = obj.target.split(':');
      if((obj.token == config.token) && (platforms[platformAndTarget[0]]) && (platforms[platformAndTarget[0]][obj.verb]))  {
        platforms[platformAndTarget[0]][obj.verb](obj.object, platformAndTarget[1], cb);
      } else {
        cb({error: 'cannot dispatch that', object: obj});
      }
    }
  }

  //set up webserver to bind WebSocket server to:
  var webServer;
  function serve(req, res) {
    res.writeHead(200);
    res.end('Welcome to sockethub welten. please connect a WebSocket to this port');
  }
  if(config.https) {
    webServer = require('https').createServer(config.https, serve);
  } else {
    webServer = require('http').createServer(serve);
  }
  webServer.listen(config.port);

  //set up WebSocket server to receive commands and call the `dispatch` function:
  var sockServer = sockjs.createServer();
  sockServer.on('connection', function(conn) {
    console.log('connected!');
    clients.push(conn);
    conn.on('data', function(chunk) {
      var obj;
      try { obj = JSON.parse(chunk); } catch(e) {}
      if(typeof(obj) == 'object') {
        dispatch(obj, function(res) {
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
      +'http'+(config.https?'s':'')+'://localhost:'+config.port+'/ works, then point your unhosted web app to '
      +'ws'+(config.https?'s':'')+'://localhost:'+config.port+'/sock/websocket - your token is: '+config.token);
});
