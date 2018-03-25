var koa = require('koa');
var app = new koa();

// x-response-time
app.use(function *(next) {
  console.log('line 1');
  const start = new Date;
  yield next;
  console.log('line 5');
  const ms = new Date - start;
  this.set('X-Response-Time', `${ms}ms`);
});

// log time
app.use(function *(next) {
  console.log('line 2');
  const start = new Date;
  yield next;
  console.log('line4');
  const ms = new Date - start;
  console.info('%s %s : %s ms', this.method, this.url, ms);
});

// response
app.use(function *(next) {
  console.log('line3');
  this.body = 'hello world';
});

app.listen(3000);