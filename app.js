
var Koa = require('koa');
var wechat = require('./wechat/wechat')
var config = {
    wechat:{
        appID:'wxc42ff5d3aab3d99a',
        appSecret:'a62177c29ad651f2bebdb9611197dad4',
        token:'TJWweixin'
    }
   
}

var app = new Koa();

app.use(wechat(config.wechat))

app.listen(4567);
console.log('正在监听4567端口！');