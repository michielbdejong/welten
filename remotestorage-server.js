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
  fs.readFile(path, function(err, data) {
    respondContent(res, data, origin);
  });
}

function serveDelete(path, origin, res) {
  fs.unlink(path, function(err) {
    respondJson((err?500:200), null, origin);
  });
}

function serveDelete(path, content, origin, res) {
  fs.writeFile(path, content, function(err) {
    respondJson((err?500:200), null, origin);
  });
}

function serveOptions(origin, res) {
  respondJson(res, null, origin);
}

function makePath(str) {
  return './data/'+str;
}

function serve(req, res) {
  var path = makePath(url.parse(req.url, true).pathname),
    origin = req.headers.origin;
  if(req.method=='OPTIONS') { serveOptions(origin, res); return; }
//  if(perms(req.headers.authorization, path, (req.method=='GET'), res)) { return; }
//  if(ifNoneMatch(req.headers['if-none-match'], (req.method=='GET'), res)) { return; }
//  if(ifMatch(req.headers['if-match'], (req.method=='GET'), res)) { return; }
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
  respondStatus(res, origin, 405);
}

module.exports = function(setDataDir) {
  dataDir = setDataDir;
  return {
    serve: serve,
    auth: auth
  };
};
