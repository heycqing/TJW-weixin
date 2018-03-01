var sha1 = require('sha1');
var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
// 处理xml
var rawBody = require('raw-body');
var util = require('../lib/util');
// get请求access_token的连接；
var prefix = 'https://api.weixin.qq.com/cgi-bin/';
var api ={
    access_token: prefix + 'token?grant_type=client_credential'
}

// 读取票据
function Wechat(opt) {
    var that =this;
    this.appID = opt.appID;
    this.appSecret = opt.appSecret;
    this.getAccessToken = opt.getAccessToken;
    this.saveAccessToken = opt.saveAccessToken;

    this.getAccessToken().then(
        function(data){
            try{
                data = JSON.parse(data);
            }catch(e){
                return that.updateAccessToken();
            }

            if(that.isValidAccessToken(data)){
                Promise.resolve(data);
            }else{
                return that.updateAccessToken();
            }
        }
    ).then(function(data){
        that.access_token = data.access_token;
        that.expires_in = data.expires_in;
    
        that.saveAccessToken(data);
    })
}

// 原型链添加函数
// 检查合法性；
Wechat.prototype.isValidAccessToken =function(data){
    if(!data || !data.access_token || !data.expires_in){
        return false;
    }

    var access_token = data.access_token;
    var expires_in = data.expires_in;
    var now = (new Date().getTime());

    if(now < expires_in){
        return true;
    }else{
        return false;
    }
}

// 更新access_token；
 Wechat.prototype.updateAccessToken = function(){
    var appID = this.appID;
    console.log('app:'+appID);
    var appSecret = this.appSecret;
    console.log('appS:'+appSecret);

    var url = api.access_token + '&appid=' +appID + '&secret='+appSecret;
    console.log('url:'+url)

    return new Promise(function(resolve,reject){
          // 请求地址
        request({url: url, json:true}).then(function(response){
            console.log(response.body);
          var data = response.body;
        //   console.log('ex::::::::::'+data);
          var now = (new Date().getTime());

        //  出现问题？？？？？？显示expires没有定义？？？
          var expires_in = now + (response.body.expires_in - 20)*1000;
            var access_token = response.body.access_token;

          data.expires_in = expires_in;
        data.access_token = access_token;
          resolve(data);

        });

    })
  
}

// 出口
module.exports = function(opt){
  

         // 实例化Wechat
         var wechat  = new Wechat(opt);

    return function *(next){
         
         var that = this;
        console.log(this.query);
        
        var token = opt.token;
        var signature = this.query.signature;
        var nonce = this.query.nonce;
        var timestamp = this.query.timestamp;
        var echostr =  this.query.echostr;
    
        var str = [token,timestamp,nonce].sort().join('');
        var sha = sha1(str);
        console.log(str);
        console.log(sha);
    
        if(this.method === 'GET' ){
            if(sha === signature){
                this.body = echostr+'';
                console.log('相等');
        
            }else{
                this.body = 'wrong!';
                console.log('wrong!');
            }
        }else if(this.method === 'POST'){

            if(sha !== signature){
                this.body = ' post is wrong!';
                return false;
            }

            // 获取xml数据
            var data = yield rawBody(this.req,{
                length:this.length,
                limit:'1mb',
                encoding:this.charset
            });
            // console.log('1111')
            // console.log('xml是:'+data.toString());

            // 转化成json数据
            var content = yield util.parseXMLAsync(data);

            // console.log('content-xml是：'+content.xml);

            var msg = util.formatMsg(content.xml);

            // console.log('msg是：'+msg);

            // 测试测试
            if(msg.MsgType === 'text'){
                var content = msg.Content;
                console.log('content是:'+content);
                console.log('是文本');
                if(content === '邂逅'){
                var now = new Date().getTime();
                this.status = 200;
                this.type = 'application/xml';
                this.body = '<xml><ToUserName>'+ msg.FromUserName+'</ToUserName><FromUserName>'+ msg.ToUserName+'</FromUserName><CreateTime>'+ now +'</CreateTime><MsgType>text</MsgType><Content>欢迎来到【邂逅实验室】，希望你能在这里邂逅到有趣的灵魂。'+'\n'+
                '为了更好地迎接即将到来的这场邂逅，'+'\n'+
                '请你认真地回答几个问题：'+'\n'+
                '我来自北师，我希望邂逅北师的朋友，请回复A；'+'\n'+
                '我来自北师，我希望邂逅北理的朋友，请回复B；'+'\n'+
                '我来自北理，我希望邂逅北理的朋友，请回复C；'+'\n'+
                '我来自北理，我希望邂逅北师的朋友，请回复D。'+'\n'+
                '活动中遇到任何问题，请添加客服微信号:TJWstation</Content>'+'</xml>';

                console.log("that.body:"+this.body)
                }
                return ;
                    
            }

            // 判断消息回复,关注和取消关注事件；

            // if(msg.MsgType == 'event'){
            //     if(msg.Event === 'subscribe'){

            //         log(this);
            //         var now = new Date().getTime();

            //         this.status = 200;
            //         this.type = 'application/xml';
            //         var reply = '<xml>'+
            //         '<ToUserName>< ![CDATA['+ msg.FromUserName+'] ]></ToUserName>'+
            //         '<FromUserName>< ![CDATA['+ msg.ToUserName+'] ]></FromUserName>'+
            //         '<CreateTime>'+ now +'</CreateTime>'+
            //         '<MsgType>< ![CDATA[text] ]></MsgType>'+
            //         '<Content>< ![CDATA[思卿，你好] ]></Content>'+'</xml>';

            //         console.log('reply是 '+ reply);
            //         this.body = reply;
            //         console.log("that.res.body:"+this.body)

            //         // this.body = 'lllllll';
            //         log(this);

            //         return ;
            //     }
            // }

        }

        
        
    }
}

function log( ctx ) {
    console.log( ctx.method, ctx.body,ctx.header.host + ctx.url )
}

