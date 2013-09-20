module.exports = function(config) {

var https = require('https'),
    FeedParser = require('feedparser'),
    mkdirp = require('mkdirp'),
    fs = require('fs');

return {
  set: function(object, target, cb) {
    var req = https.request({ method: 'POST', host: 'accounts.google.com', path: '/o/oauth2/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }, function(res) {
        var str;
        res.on('data', function(chunk) { str += chunk; });
        res.on('end', function() {
           cb(str);
        });
    });
    req.on('error', function(err) { cb('https request errror:'+err); });
    var reqStr = 'code='+object +'&client_id='+config.client_id +'&client_secret='+config.client_secret
      +'&redirect_uri='+config.redirect_uri +'&grant_type=authorization_code';
    console.log('sending Google:'+reqStr);
    req.end(reqStr);
  },
  get: function(object, target, cb) {
    var req = https.request({ method: 'GET', host: 'www.google.com', path: '/m8/feeds/contacts/default/full',
      headers: {
        'GData-Version': '3.0',
        'Authorization': 'Bearer '+config.access_token
      }
    }, function(res) {
      mkdirp('./data/contacts/Google/');
      res.pipe(new FeedParser()).on('error', function(error) {
        cb({error: error});
      }).on('readable', function () {
        var stream = this, item;
        while (item = stream.read()) {
          if(typeof(item.title)=='string') {
            var obj={};
            if((item['gd:name']) && (item['gd:name']['gd:fullname']) && (item['gd:name']['gd:fullname']['#'])) {
              obj.fn=item['gd:name']['gd:fullname']['#'];
            }
            if((item['gd:email']) && (item['gd:email']['@']) && (item['gd:email']['@']['address'])) {
              obj.email=item['gd:email']['@']['address'];
            }
            fs.writeFile('./data/contacts/Google/'+encodeURIComponent(item.guid), JSON.stringify(obj), function(err) {
              obj.err = err; cb(obj);
            });
          }
        }
      });
    });
    req.on('error', function(err) { cb('https request errror:'+err); });
    req.end();
  }
}; 
}; 
