var fs = require('fs'),
    config = require('../data/config').remotestorage,
    url=require('url'),
    crypto=require('crypto'),
    tokens, version, contentType, content;

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

function addToken(token, scopes) {
  tokens[token] = makeScopePaths(scopes);
}

function createToken(scopes, cb) {
  crypto.randomBytes(48, function(ex, buf) {
    var token = buf.toString('hex');
    var scopePaths = makeScopePaths(scopes);
    tokens[token] = scopePaths;
    cb(token);
  });
}

function mayRead(authorizationHeader, path) {
  if(authorizationHeader) {
    var scopes = tokens[authorizationHeader.substring('Bearer '.length)];
    if(scopes) {
      for(var i=0; i<scopes.length; i++) {
        var scopeParts = scopes[i].split(':');
        if(path.substring(0, scopeParts[0].length)==scopeParts[0]) {
          return true;
        }
      }
    }
  } else {
    var pathParts = path.split('/');
    console.log('pathParts are', pathParts);
    return (pathParts[0]=='me' && pathParts[1]=='public' && path.substr(-1) != '/');
  }
}

function mayWrite(authorizationHeader, path) { 
  if(path.substr(-1)=='/') {
    return false;
  }
  if(authorizationHeader) {
    var scopes = tokens[authorizationHeader.substring('Bearer '.length)];
    if(scopes) {
      for(var i=0; i<scopes.length; i++) {
        var scopeParts = scopes[i].split(':');
        if(scopeParts.length==2 && scopeParts[1]=='rw' && path.substring(0, scopeParts[0].length)==scopeParts[0]) {
          return true;
        }
      }
    }
  }
}

function writeHead(res, status, origin, timestamp, contentType) {
  console.log('writeHead', status, origin, timestamp, contentType);
  var headers = {
    'Access-Control-Allow-Origin': (origin?origin:'*'),
    'Access-Control-Allow-Headers': 'authorization, origin, if-none-match, if-match, content-type, content-length',
    'Access-Control-Expose-Headers': 'content-type, etag, content-length',
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE',
  };
  if(typeof(timestamp) != 'undefined') {
    headers['etag']= timestamp.toString();
  }
  if(contentType) {
    headers['content-type']= contentType;
  }
  res.writeHead(status, headers);
}

function respondContent(res, contentType, content, origin, timestamp) {
  writeHead(res, 200, origin, timestamp, contentType);
  res.end(content);
}

function respondJson(res, obj, origin, timestamp) {
  respondContent(res, 'application/json', JSON.stringify(obj), origin, timestamp);
}

function respondStatus(res, origin, status, timestamp) {
  writeHead(res, status, origin, timestamp);
  res.end();
}

function toHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function oauth(req, res) {
  var urlObj = url.parse(req.url, true);
  var scopes = decodeURIComponent(urlObj.query['scope']).split(' '),
  clientId = decodeURIComponent(urlObj.query['client_id']),
  redirectUri = decodeURIComponent(urlObj.query['redirect_uri']),
  clientIdToMatch;
    createToken(scopes, function(token) {
      respondContent(res, 'text/html', '<!DOCTYPE html lang="en"><head><title>'+config.host+'</title><meta charset="utf-8"></head><body><a href="'+toHtml(redirectUri)+'#access_token='+toHtml(token)+'">Allow</a></body></html>');
    });
  //}
}

function condMet(cond, path) {
  if(cond.ifNoneMatch=='*') {//if-none-match is either '*'...
    if(content[path]) {
      return false;
    }
  } else if(cond.ifNoneMatch && version[path]) {//or a comma-separated list of etags
    if(cond.ifNoneMatch.split(',').indexOf(version[path])!=-1) {
      return false;
    }
  }
  if(cond.ifMatch) {//if-match is always exactly 1 etag
    if(version[path]!=cond.ifMatch) {
      return false;
    }
  }
  return true;
}

function storage(req, res) {
  var urlObj = url.parse(req.url, true);
  var path=urlObj.pathname.substring('/storage/'.length);
  var cond = {
    ifNoneMatch: req.headers['if-none-match'],
    ifMatch: req.headers['if-match']
  };
  var capt = {
    method: req.method,
    path: path
  };

  if(req.method=='OPTIONS') {
    respondJson(res, null, req.headers.origin);
  } else if(req.method=='GET') {
    if(!mayRead(req.headers.authorization, path)) {
      respondStatus(res, req.headers.origin, 401);
    } else if(!condMet(cond, path)) {
      respondStatus(res, req.headers.origin, 304, version[path]);
    } else {
      if(content[path]) {
        if(path.substr(-1)=='/') {
          respondJson(res, content[path], req.headers.origin, 0, cond);
        } else {
          respondContent(res, contentType[path], content[path], req.headers.origin, version[path], cond);
        }
      } else {
        if(path.substr(-1)=='/') {
          respondJson(res, {}, req.headers.origin, 0, cond);
        } else {
          writeHead(res, 404, req.headers.origin);
          res.end();
        }
      }
    }
  } else if(req.method=='PUT') {
    if(!mayWrite(req.headers.authorization, path)) {
      respondStatus(res, req.headers.origin, 401);
    } else if(!condMet(cond, path)) {
      respondStatus(res, req.headers.origin, 412, version[path]);
    } else {
      var dataStr = '';
      req.on('data', function(chunk) {
        dataStr+=chunk;
      });
      req.on('end', function(chunk) {
        var timestamp = new Date().getTime();
        capt.body = dataStr;
        content[path]=dataStr;
        contentType[path]=req.headers['content-type'];
        version[path]=timestamp;
        var pathParts=path.split('/');
        var timestamp=new Date().getTime();
        var fileItself=true;
        while(pathParts.length > 1) {
          var thisPart = pathParts.pop();
          if(fileItself) {
            fileItself=false;
          } else {
            thisPart += '/';
          }
          if(!content[pathParts.join('/')+'/']) {
            content[pathParts.join('/')+'/'] = {};
          }
          content[pathParts.join('/')+'/'][thisPart]=timestamp;
        }
        respondJson(res, null, req.headers.origin, timestamp);
      });
    }
  } else if(req.method=='DELETE') {
    if(!mayWrite(req.headers.authorization, path)) {
      respondStatus(res, req.headers.origin, 401);
    } else if(!condMet(cond, path)) {
      respondStatus(res, req.headers.origin, 412, version[timestamp]);
    } else {
      var timestamp = new Date().getTime();
      delete content[path];
      delete contentType[path];
      version[path]=timestamp;
      var pathParts=path.split('/');
      var thisPart = pathParts.pop();
      if(content[pathParts.join('/')+'/']) {
        delete content[pathParts.join('/')+'/'][thisPart];
      }
      respondJson(res, null, req.headers.origin, timestamp);
    }
  } else {
    respondStatus(res, req.headers.origin, 405);
  }
}

//...
if(config.https) {
  require('https').createServer(config.https, storage).listen(config.port1);
  require('https').createServer(config.https, oauth).listen(config.port2);
} else {
  require('http').createServer(storage).listen(config.port1);
  require('http').createServer(oauth).listen(config.port2);
}
console.log("remoteStorage server started on 0.0.0.0:" + config.port1 + " and 0.0.0.0:" + config.port2);

module.exports = {
  inbox: function(platform, message) {
    console.log('saving to inbox', platform, message);
  }
};
