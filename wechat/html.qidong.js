const Koa = require('koa');
const fs = require('fs');
const app = new Koa();


const main = ctx => {
    ctx.response.type = 'html';
    ctx.response.body = fs.createReadStream('../app.html');
  };
  
app.use(main);
// app.use(router.routes());
 
app.listen(4000);
// console.log('curl -i http://localhost:3000/users -d "name=test"');
console.log('html在运行')