module.exports = function(config) {
var exec = require('child_process').exec;
return {
  execute: function(object, target, cb) {
    exec(object, function (err, stdout, stderr) { 
      if(err) {
        cb({
          err: err,
          stdout: stdout,
          stderr: stderr
        });
      } else {
        //TODO: deal with commands that do not complete immediately
        cb({
          stdout: stdout,
          stderr: stderr
        });
      }
    });
  }
};
};
