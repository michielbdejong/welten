var fs = require('fs');

module.exports = {
  retrieve: function(object, target, cb) {
    fs.readFile(target, function(err, data) {
      if(err) {
        cb({error: err});
      } else {
        cb({result: data.toString()});
      }
      console.log(object, target, err, data.toString());
    })
  },
  save: function(object, target, cb) {
    fs.writeFile(target, object, function(err) {
      if(err) {
        cb({error: err});
      } else {
        cb({result: 'ok'});
      }
    });
  }
};
