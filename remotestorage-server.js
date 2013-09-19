var fs = require('fs'),
    url=require('url'),
    crypto=require('crypto'),
    dataDir;//to be set when requiring this module

function makeScopePaths(scopes) {
  var scopePaths=[];
  for(var i=0; i<scopes.length; i++) {
    var thisScopeParts = scopes[i].split(':');
    if(thisScopeParts[0]=='root') {
      scopePaths.push('/:'+thisScopeParts[1]);
    } else {
      scopePaths.push('/'+thisScopeParts[0]+'/:'+thisScopeParts[1]);
      scopePaths.push('/public/'+thisScopeParts[0]+'/:'+thisScopeParts[1]);
    }
  }
  return scopePaths;
}

function createToken(scopes, cb) {
  crypto.randomBytes(48, function(ex, buf) {
    var token = buf.toString('hex');
    var scopePaths = makeScopePaths(scopes);
    doWrite('/apps/'+token, JSON.stringify(scopePaths), function(err) {
      cb(token);
    });
  });
}

function writeHead(res, status, origin, etag, contentType) {
  var headers = {
    'Access-Control-Allow-Origin': (typeof(origin)=='string'?origin:'*'),
    'Access-Control-Allow-Headers': 'authorization, origin, if-none-match, if-match, content-type, content-length',
    'Access-Control-Expose-Headers': 'content-type, etag, content-length',
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE',
  };
  if(typeof(etag) == 'string') {
    headers['etag']= etag;
  }
  if(typeof(contentType) == 'string') {
    headers['content-type']= contentType;
  }
  res.writeHead(status, headers);
}

function respondContent(res, content, origin, etag, contentType) {
  writeHead(res, 200, origin, etag, contentType);
  res.end(content);
}

function respondJson(res, obj, origin, etag) {
  respondContent(res, JSON.stringify(obj), origin, etag, 'application/json');
}

function respondStatus(res, status, origin, etag) {
  writeHead(res, status, origin, etag);
  res.end();
}

function serveGet(path, origin, res) {
  fs.stat(path, function(err1, stat) {
    if(err1) {
      console.log('stat error', path, err1);
      respondStatus(res, 404, origin);
    } else {
      if(path.substr(-1)=='/' && stat.isDirectory()) {
        fs.readdir(path, function(err2, listing) {
          var i, etags={}, thisStat;
          for(i=0; i<listing.length; i++) {
            thisStat = fs.statSync(path+listing[i]);
            etags[listing[i] + (thisStat.isDirectory()?'/':'')] = thisStat.mtime.getTime().toString();
          }
          respondContent(res, JSON.stringify(etags), origin, stat.mtime.getTime().toString(), 'application/json');
        });
      } else if(path.substr(-1)!='/' && stat.isFile()) {
        fs.readFile(path, function(err2, data) {
          //console.log(path, err1, err2, data);
          respondContent(res, data, origin, stat.mtime.getTime().toString(), 'application/octet-stream');
        });
      } else {
        console.log('wrong inode type', path, err1);
        respondStatus(res, 404, origin);
      }
    }
  });
}

function serveDelete(path, origin, res) {
  fs.unlink(path, function(err) {
    respondJson(res, (err?500:200), null, origin);
  });
}

function servePut(path, content, origin, res) {
  fs.writeFile(path, content, function(err) {
    respondJson(res, (err?500:200), null, origin);
  });
}

function serveOptions(origin, res) {
  respondJson(res, null, origin);
}

function makePath(str) {
  return './data/'+str;
}

function ifNoneMatch(etags, path, origin, isGet, res) {
  var stat;
  try {
    stat = fs.statSync(path);
  } catch(e) {//probably a 404
    return false;
  }
  var currEtag = stat.mtime.getTime().toString();
  for(var i=0; i<etags.length; i++) {
    if(currEtag==etags[i]) {
      respondStatus(res, (isGet?304:412), origin, currEtag);
      return true;
    } 
  }
}

function serve(req, res) {
  var path = makePath(url.parse(req.url, true).pathname),
    origin = req.headers.origin;
  if(req.method=='OPTIONS') { serveOptions(origin, res); return; }
//  if(perms(req.headers.authorization, path, origin, (req.method=='GET'), res)) { return; }
  if(ifNoneMatch([req.headers['if-none-match']], path, origin, (req.method=='GET'), res)) { return; }
//  if(ifMatch(req.headers['if-match'], path, origin,(req.method=='GET'), res)) { return; }
  if(req.method=='GET') { serveGet(path, origin, res); return; }
  if(req.method=='DELETE') { serveDelete(path, origin, res); return; }
  if(req.method=='PUT') {
    var dataStr = '';
    req.on('data', function(chunk) {
      dataStr+=chunk;
    });
    req.on('end', function() {
      servePut(path, dataStr, origin, res);
    });
    return; 
  }
  respondStatus(res, 405, origin);
}

function auth(query, cb) {
  cb(null, query.redirect_uri+'#access_token=anything', false);
}

module.exports = function(setDataDir) {
  dataDir = setDataDir;
  return {
    serve: serve,
    auth: auth
  };
};
