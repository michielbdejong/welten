var connect = require('connect'),
    config = require('../data/config').www;

//for https you would probably use something slightly less terse,
// with https.createServer instead here, see https://npmjs.org/package/connect

connect().use(
  connect.static(config.contentDir)
).listen(config.port);
