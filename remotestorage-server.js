var fs = require('fs'),
    url=require('url'),
    crypto=require('crypto'),
    xattr=require('xattr-async'),
    mkdirp=require('mkdirp'),
    dataDir;//to be set when requiring this module

function doWrite(path, contentType, content, cb) {
  var parts = path.split('/');
  parts.pop();
  var dirname = parts.join('/');
  mkdirp(dirname, function(err1) {
    fs.writeFile(path, content, function(err2) {
      if(err2) {
        cb(err2);
      } else {
        xattr.set(path, 'Content-Type', contentType, cb);
      }
    });
  });
}

function makePath(str) {
  while(str.substring(0,1)=='.' || str.substring(0,1)=='/') {
   str = str.substring(1);
  }
  return './data/'+str;
}

function makeScopePaths(scopes) {
  var scopePaths={};
  for(var i=0; i<scopes.length; i++) {
    var thisScopeParts = scopes[i].split(':');
    if((thisScopeParts.length!=2)
        || (thisScopeParts[0].indexOf('/')!=-1)
        || (['r', 'rw'].indexOf(thisScopeParts[1])==-1)) {
      continue;
    }
    if(thisScopeParts[0]=='root') {
      scopePaths[makePath('')]=thisScopeParts[1];
    } else {
      scopePaths[makePath(thisScopeParts[0]+'/')]=thisScopeParts[1];
      scopePaths[makePath('public/'+thisScopeParts[0]+'/')]=thisScopeParts[1];
    }
  }
  return scopePaths;
}

function createToken(scopes, cb) {
  crypto.randomBytes(48, function(ex, buf) {
    var token = buf.toString('hex');
    var scopePaths = makeScopePaths(scopes);
    doWrite(makePath('/apps/'+token), 'application/json', JSON.stringify(scopePaths), function(err) {
      cb(token);
    });
  });
}

function perms(authorizationHeader, path, origin, isGet, res) {
  var pubPath = makePath('public/');
  if(isGet && path.substr(-1) != '/' && path.substr(0, pubPath.length)==pubPath) {
    return false;
  }
  var scopePaths, token = authorizationHeader.substring('Bearer '.length);
  try {
    scopePaths = JSON.parse(fs.readFileSync(makePath('/apps/'+token)));
  } catch(e) {//Bearer token unknown
    respondStatus(res, 401, origin);
    return true;
  }
  for(var i in scopePaths) {
    if((path.substring(0, i.length)==i)
        && (isGet || scopePaths[i]=='rw')) {
      return false;
    }
  }
  //Bearer token gives no access
  respondStatus(res, 401, origin);
  return true;
}

function getCurrEtag(path) {
  var stat;
  try {
    stat = fs.statSync(path);
  } catch(e) {//probably a 404
    return false;
  }
  return stat.mtime.getTime().toString();
}

function ifMatch(etag, path, origin, isGet, res) {
  var currEtag = getCurrEtag(path);
  if(currEtag!=etag) {
    respondStatus(res, (isGet?304:412), origin, currEtag);
    return true;
  }
}

function ifNoneMatch(etags, path, origin, isGet, res) {
  if(!Array.isArray(etags)) {
    etags = [etags];
  }
  var currEtag = getCurrEtag(path);
  for(var i=0; i<etags.length; i++) {
    if(currEtag==etags[i]) {
      respondStatus(res, (isGet?304:412), origin, currEtag);
      return true;
    } 
  }
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

function serveGetDir(path, origin, res) {
  fs.readdir(path, function(err2, listing) {
    var i, etags={}, thisStat;
    for(i=0; i<listing.length; i++) {
      thisStat = fs.statSync(path+listing[i]);
      etags[listing[i] + (thisStat.isDirectory()?'/':'')] = thisStat.mtime.getTime().toString();
    }
    respondContent(res, JSON.stringify(etags), origin, stat.mtime.getTime().toString(), 'application/json');
  });
}

function serveGet(path, origin, res) {
  fs.stat(path, function(err1, stat) {
    if(err1) {
      respondStatus(res, 404, origin);
    } else {
      if(path.substr(-1)=='/' && stat.isDirectory()) {
        serveGetDir(path, origin, res);
      } else if(path.substr(-1)!='/' && stat.isFile()) {
        fs.readFile(path, function(err2, data) {
          respondContent(res, data, origin, stat.mtime.getTime().toString(), 'application/octet-stream');
        });
      } else {
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

function servePut(path, contentType, content, origin, res) {
  doWrite(path, contentType, content, function(err) {
    respondJson(res, (err?500:200), null, origin);
  });
}

function serveOptions(origin, res) {
  respondJson(res, null, origin);
}

function serve(req, res) {
  var path = makePath(url.parse(req.url, true).pathname),
    origin = req.headers.origin;
  if(req.method=='OPTIONS') { serveOptions(origin, res); return; }
  if(perms(req.headers.authorization, path, origin, (req.method=='GET'), res)) { return; }
  if(ifNoneMatch([req.headers['if-none-match']], path, origin, (req.method=='GET'), res)) { return; }
  if(ifMatch(req.headers['if-match'], path, origin,(req.method=='GET'), res)) { return; }
  if(req.method=='GET') { serveGet(path, origin, res); return; }
  if(req.method=='DELETE') { serveDelete(path, origin, res); return; }
  if(req.method=='PUT') {
    var dataStr = '';
    req.on('data', function(chunk) {
      dataStr+=chunk;
    });
    req.on('end', function() {
      servePut(path, req.headers['content-type'], dataStr, origin, res);
    });
    return; 
  }
  respondStatus(res, 405, origin);
}

function auth(query, cb) {
  createToken(query.scope.split(' '), function(token) {
    cb(null, query.redirect_uri+'#access_token='+encodeURIComponent(token), false);
  });
}

module.exports = function(setDataDir) {
  dataDir = setDataDir;
  return {
    serve: serve,
    auth: auth
  };
};
