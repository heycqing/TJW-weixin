var parallel = require('co-parallel');
var request = require('co-request');
var co = require('co');

var urls = [
//   'http://google.com',
//   'http://yahoo.com',
//   'http://ign.com',
//   'http://cloudup.com',
//   'http://myspace.com',
//   'http://facebook.com',
//   'http://segment.io'
     'http://baidu.com',
     'https://github.com/tj/co-parallel'
];

function *status(url) {
  console.log('GET %s', url);
  return (yield request(url)).statusCode;
}

co(function *(){
  var reqs = urls.map(status);
  var res = yield parallel(reqs, 2);
  console.log(res);
})();
