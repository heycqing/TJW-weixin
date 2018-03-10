
var Koa = require('koa');
var path = require('path');
var wechat = require('./wechat/wechat');
var util = require('./lib/util')
var wechat_file = path.join(__dirname,'./config/wechat_file.txt') 
var config = {
    wechat:{
        appID:'wxc42ff5d3aab3d99a',
        appSecret:'a62177c29ad651f2bebdb9611197dad4',
        token:'TJWweixin',
        getAccessToken : function(){
            return util.readFileAsync(wechat_file);
        },
        saveAccessToken : function(data){
            data = JSON.stringify(data);
            return util.writeFileAsync(wechat_file,data);
        }
    }
   
}

var app = new Koa();

app.use(wechat(config.wechat))

app.listen(2253);
console.log('正在监2253端口！');