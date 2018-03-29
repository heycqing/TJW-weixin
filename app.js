
var Koa = require('koa');
var path = require('path');
var wechat = require('./wechat/wechat');
var util = require('./lib/util')
var wechat_file = path.join(__dirname,'./config/wechat_file.txt') 
var config = {
    wechat:{
        appID:'wxc42ff5d3aab3d99a',
        appSecret:'bcfbd3e30806bf84db6908bfbe30994e',
        token:'TJWweixin',
        accsee_token_:'',
        // i:0,
        getAccessToken : function(){
            return util.readFileAsync(wechat_file);
        },
        saveAccessTokenInConfig: function(data){
            data = JSON.stringify(data);
            console.log('存储的data是：'+data)
            this.accsee_token_ = data.accsee_token;
            console.log('存储的data/accee_token是：'+this.accsee_token_)
            

        },
        saveAccessToken : function(data){
            data = JSON.stringify(data);
            return util.writeFileAsync(wechat_file,data);
        },
        
    }
   
}

var app = new Koa();

app.use(
    
    wechat(config.wechat)
);



app.listen(1234);
console.log('正在监1234端口！');