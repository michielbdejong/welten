//force dependency on sockethub-0.1.0:
module.exports = function(config) {
  var WebSocketClient = require('websocket').client,
    client = new WebSocketClient(),
    connection,
    outstanding={};

  client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
  });

  client.on('connect', function(setConnection) {
    connection = setConnection;
    console.log('WebSocket client connected');
    connection.on('error', function(error) {
      console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function() {
      console.log('echo-protocol Connection Closed');
    });
    connection.on('message', function(message) {
      if (message.type === 'utf8') {
        console.log("Received: '" + message.utf8Data + "'");
        try {
          var obj= JSON.parse(message.utf8Data);
          if(outstanding[obj.rid]) {
            outstanding[obj.rid](obj);
            delete outstanding[obj.rid];
          }
        } catch(e) {
          console.log('error with sockethub response', e);
        }
      }
    });
  });

  client.connect(config.url, 'sockethub');
  return {
    do: function(obj, cb) {
      if(connection.connected) {
        outstanding[obj.rid]=cb;
        connection.sendUTF(JSON.stringify(obj));
      }
    }
  };
};
