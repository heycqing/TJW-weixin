
var Koa = require('koa');
var sha1 = require('sha1');
var config = {
    wechat:{
        appID:'wxc42ff5d3aab3d99a',
        appSecret:'a62177c29ad651f2bebdb9611197dad4',
        token:'TJWweixin'
    }
   
}

var app = new Koa();

app.use(function *(next){
    console.log(this.query);
    
    var token = config.wechat.token;
    var signature = this.query.signature;
    var nonce = this.query.nonce;
    var timestamp = this.query.timestamp;
    var echostr =  this.query.echostr;

    var str = [token,timestamp,nonce].sort().join('');
    var sha = sha1(str);
    console.log(str);
    console.log(sha);

    if(sha === signature){
        this.body = echostr+'';
        console.log('相等');

    }else{
        this.body = 'wrong!';
        console.log('wrong!');
    }
})

app.listen(4567);
console.log('正在监听4567端口！');