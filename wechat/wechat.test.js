// 'use staice'
var sha1 = require('sha1');
var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var fs = require('fs');
var path = require('path')
// 连接数据库并将数据输入数据库
var mysql  = require('mysql');  

var wechat_file = path.join(__dirname,'../config/wechat_file.txt') 
// var picUrl = path.join(__dirname,'../public/1.jpeg')
// 处理xml;
var rawBody = require('raw-body');
var util = require('../lib/util');
var getFrom = require('./promises')
var getKefu = require('./kefu');
var getKefu_acc = require('./kefu_get')


// get请求access_token的连接；
var prefix = 'https://api.weixin.qq.com/cgi-bin/';
var api ={
    i:0,
    users:[],
    access_token_:'',
    access_token: prefix + 'token?grant_type=client_credential',
    uploadTempMaterial:prefix+'media/upload?',  //access_token=ACCESS_TOKEN&type=TYPE  上传临时素材
    keyWord:prefix+'get_current_autoreply_info?access_token=',
    openId:prefix+'user/info/batchget?access_token=',
    getAccessToken : function(){
        return util.readFileAsync(wechat_file);
    },
    add:function(){
        this.i+=1;
        return this.i;
    },
    getUserInfo : function(){
        if(api.access_token_){
           var url = api.openId+api.access_token_;
           console.log('获取用户信息url:'+url);
   
           return new Promise(function(resolve,reject){
               // 请求地址
                request({url: url, json:true}).then(function(response){
                console.log(response.body);
                var data = response.body;
                console.log('获取用户是：'+data);
                resolve(data);
        
                });
            })
        }else{
            console.log('accee_token为空！')
        }
    }

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
        //   设置自动回规则
        // that.saveAccessTokenInConfig(data);
        that.getUserInfo(data);
        
        // api.access_token_ = that.access_token_;
        
        // that.getAutoReply(that.access_token);
        
    })


}
// 获取用户信息
Wechat.prototype.getUserInfo = function(data){
    if(data){
       var url = api.openId+data;
       console.log('获取用户信息url:'+url);

       return new Promise(function(resolve,reject){
           // 请求地址
            request({url: url, json:true}).then(function(response){
            console.log(response.body);
            var data_ = response.body;
            console.log('获取用户是：'+data_);
            resolve(data_);
    
            });
        })
    }else{
        console.log('accee_token为空！')
    }
}

// 更新自动回复规则
Wechat.prototype.getAutoReply = function(a){
    

    var url = api.keyWord + a;
    console.log('自动回复规则url:'+url);

    return new Promise(function(resolve,reject){
        // 请求地址
      request({url: url, json:true}).then(function(response){
          console.log(response.body);
        var data = response.body;
        console.log('自动回复规则是：'+data.is_add_friend_reply_open);
        resolve(data);

      });

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

Wechat.prototype.fetchAccessToken = function(){
	var that = this;

	// 如果this上已经存在有效的access_token，直接返回this对象
	if(this.access_token && this.expires_in){
		if(this.isvalidAccessToken(this)){
			return Promise.resolve(this);
		}
	}

	this.getAccessToken().then(function(data){
		try{
			data = JSON.parse(data);
		}catch(e){
			return that.updateAccessToken();
		}
		if(that.isvalidAccessToken(data)){
			return Promise.resolve(data);
		}else{
			return that.updateAccessToken();
		}
	}).then(function(data){
		that.access_token = data.access_token;
		that.expires_in = data.expires_in;
		that.saveAccessToken(JSON.stringify(data));
		return Promise.resolve(data);
	});
}

// 上传临时素材；
Wechat.prototype.uploadTempMaterial = function(type,filepath){
	var that = this;
	var form = {  //构造表单
		media:fs.createReadStream(filepath)
	}
	return new Promise(function(resolve,reject){
		that.fetchAccessToken().then(function(data){
			var url = api.uploadTempMaterial + 'access_token=' + data.access_token + '&type=' + type;
			request({url:url,method:'POST',formData:form,json:true}).then(function(response){
				var _data = response.body;
				if(_data){
					resolve(_data)
				}else{
					throw new Error('upload temporary material failed!');
				}
			}).catch(function(err){
				reject(err);
			});
		});
	});
}

Wechat.prototype.getMaterial = function(mediaId,permanent){
	var that = this;
	var getUrl = permanent ? api.getPermMaterial : api.getTempMaterial;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken().then(function(data){
			var url = getUrl + 'access_token=' + data.access_token;
			if(!permanent) url += '&media_id=' + mediaId;
			resolve(url)
		});
	});
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

               var content = yield util.parseXMLAsync(data);

               // 转化成json数据                
               var msg =  util.formatMsg(content.xml);
               console.log('msg'+msg)
               console.log('msg.tpye:'+msg.MsgType)
           if(msg.Content === '邂逅'){
            var now = new Date().getTime();
            this.status = 200;
            this.type = 'application/xml';
            var back = '邂逅实验室还没上线喔～请明天10点再来～';
            this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back)
           }
           else if(msg.MsgType === voice){
            var now = new Date().getTime();
            this.status = 200;
            this.type = 'application/xml';
            var back = '已经保存你的语音咯～';
            this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back)
           }
            else{
                var now = new Date().getTime();
                this.status = 200;
                this.type = 'application/xml';
                var back = '听不懂你在说的是什么？';
                this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back)
              
                console.log("that.body:"+this.body)
            }

    //                 //    return ;
             
           
           
                }
            
         
           
       }
    
}





// 读取txt内容
function toJson(wechat_file){
    fs.readFile(wechat_file, "utf-8", function(error, config) {
        if (error) {
            console.log(error);
            console.log("config文件读入出错");
        }
   
    console.log(config.toString());
    var temp= config.toString();
    var data =JSON.parse(temp)
    console.log('原来的函数 access_token：'+data.access_token)
    // temp_access = data.access_token;
    return data.access_token;
});
   

}

// 回复文本信息；
function xmlToreply_body(){
    // console.log(this.body)
    var now = new Date().getTime();

    this.status = 200;
    this.type = 'application/xml';
    
    var a ='o5UHAw4wsVakuATXga0y4JnLZ3Gc';
    var b = 'gh_2b1961cfa81a';
    // var c = new Date().getTime();
    var d= 'wwwwwwww';
    var e ='Pkq5wlSpbw0Db_JUeSioVFMycCKdy5gfCBlCc43AjfrqaRNpx-d5A0-Ub89t97z1'
    
    var reply ='<xml><ToUserName>'+ a+'</ToUserName><FromUserName>'+ b+'</FromUserName><CreateTime>'+ now +'</CreateTime><MsgType>text</MsgType><Content>'+d+'</Content>'+'</xml>';
    this.body = reply;

     
    
   
}



// 回复文本信息；
function xmlToreply(a,b,c,d){
    var reply ='<xml><ToUserName>'+ a+'</ToUserName><FromUserName>'+ b+'</FromUserName><CreateTime>'+ c +'</CreateTime><MsgType>text</MsgType><Content>'+d+'</Content>'+'</xml>';
    console.log(reply);
    return reply;
}

// 回复图片；
function imgType(a,b,c,d){
    var reply = '<xml><ToUserName>'+a+'</ToUserName><FromUserName>'+b
    +'</FromUserName><CreateTime>'+c+'</CreateTime><MsgType>image</MsgType><Image><MediaId>'+d
    +'</MediaId></Image></xml>'
    console.log(reply);
    return reply;
}
// 随机回复图片

function random_imgReply(a,b,c,d){
    var ac = Math.floor(Math.random()*Save_imgUrl.length);
                        if(Save_imgUrl[ac] == d){
                            if(ac==0){
                            var back_msg = Save_imgUrl[ac+1];
                                
                            }
                            var back_msg = Save_imgUrl[ac];
                        }else{
                            var back_msg = Save_imgUrl[ac];
                            
                        }
}


// 回复图文
function tuWen(a,b,c,d){
    var ac = Math.floor(Math.random()*Save_imgUrl.length);
                        if(Save_imgUrl[ac] == d){
                            if(ac==0){
                            var back_msg = Save_imgUrl[ac+1];
                                
                            }
                            var back_msg = Save_imgUrl[ac];
                        }else{
                            var back_msg = Save_imgUrl[ac];
                            
                        }
    var reply = '<xml><ToUserName>'+a+'</ToUserName><FromUserName>'+b+'</FromUserName><CreateTime>'+c+'</CreateTime><MsgType>news</MsgType><ArticleCount>1</ArticleCount>'+'<Articles><item><Title>邂逅实验室(点击可看)</Title> <Description>你的照片已经成功提交到【邂逅实验室】啦，'+'\n'+
    '这是我给你找的邂逅对象（只有这一个哦）先看看Ta精心挑选的照片，'+'\n'+
    '然后决定是否与Ta进一步沟通，慎重考虑噢，或许这是你们唯一一次认识对方的机会。'+'\n'+
    '继续聊 请回复 1，'+'\n'+
   '没兴趣 请回复 2。'+'\n'+ '</Description><PicUrl>'+back_msg+'</PicUrl><Url>'+back_msg+'</Url></item</Articles></xml>';
   return reply;
}

//回复语音
function voicetype(a,b,c,d){
   var reply = '<xml><ToUserName>'+a+'</ToUserName><FromUserName>'+b+'</FromUserName><CreateTime>'+c+'</CreateTime><MsgType>voice</MsgType><Voice><MediaId>'+d+'</MediaId></Voice></xml>';
   return reply;
}

// 连接数据库
function chaxun_(sql,temp_picUrl){
    var connection = mysql.createConnection({     
        host: '39.108.58.83',
        user: 'root',
        password: '1234',
        port: '3306',
        database: 'TJW',
    }); 
     
    connection.connect();
    connection.query(sql,function (err, result) {
        if(err){
        console.log('[SELECT ERROR] - ',err.message);
        return;
        }

    console.log('--------------------------SELECT----------------------------');

    

    var a = Math.floor(Math.random()*result.length);
    console.log(a);
    
    if(result[a].picId === temp_picUrl){
        a =  a - 1;
        console.log(result[a].picId);
        return result[a].picId

    }else{
        console.log(result[a].picId);
        return result[a].picId
        
    }
        // console.log(result)
        console.log('------------------------------------------------------------\n\n'); 

    });
    connection.end();
    

}


function log( ctx ) {
    console.log( ctx.method, ctx.body,ctx.header.host + ctx.url )
}

function date2str(x, y) {
    var z = {
        y: x.getFullYear(),
        M: x.getMonth() + 1,
        d: x.getDate(),
        h: x.getHours(),
        m: x.getMinutes(),
        s: x.getSeconds(),
        ms: x.getMilliseconds()
    };
    return y.replace(/(y+|M+|d+|h+|m+|s+|ms+)/g, function(v) {
        return ((v.length > 1 ? "0" : "") + eval('z.' + v.slice(-1))).slice(-(v.length > 2 ? v.length : 2))
    });
}

