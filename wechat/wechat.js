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

            //    同步操作插入数据库
            // 判断是否为空，
            var s = yield getFrom.getContentFromDB(msg.FromUserName);
            console.log('\n\n\n判断此处是：'+s +'\n\n\n')
            if(!(yield getFrom.getContentFromDB(msg.FromUserName))){
               yield getFrom.insert_openID(msg.FromUserName);
                
            }

        //    提取openid和play作为判断
               var gl =yield getFrom.getOpenIdFromDB(msg.FromUserName);

               console.log('\n\n\n'+gl+'\n\n\n');

               var playcount = yield getFrom.getPlayFromDB(msg.FromUserName);

               var n = yield getFrom.getContentFromDB(msg.FromUserName);
               console.log('\n\n'+n+'\n\n')





        if( playcount === 1 ){
            // 判断是否是同一个人，并且提取content内容，
            if( msg.MsgType === 'text' && gl == msg.FromUserName ){

                var content = msg.Content;
                console.log('content是:'+content);
                // 获取数据库中的content数据；
          
            
                if(content === '邂逅' && (n === null || n === '')){
                    var now = new Date().getTime();
                    this.status = 200;
                    this.type = 'application/xml';
                    
                    var back = '欢迎来到【邂逅实验室】，'+'\n'+
                    '遇见你真好。'+'\n'+
                    '首先，请订制你想要的邂逅：'+'\n'+
                    '我是男生，想邂逅男生，回复【A】'+'\n'+
                    '我是男生，想邂逅女生，回复【B】'+'\n'+
                    '我是女生，想邂逅男生，回复【C】'+'\n'+
                    '我是女生，想邂逅女生，回复【D】';
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back);
                    var access_token_0= yield getKefu_acc.toJson(wechat_file);
                    console.log('\n\n\ndddddd\n\n')
                    setTimeout(function(){
                                
                        var url = 'https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token='+access_token_0;
                        // var msgUser = 'oRFFw07pJC1DfxCv7N5oRU0ANePw';
                        var requestData ={
                            touser:msg.FromUserName,
                            msgtype:"image",
                            image:{
                    
                                "media_id":"kFWxB23toAeVAIRV5tJ27bPtSigQiLaZ6GBkSCTwz7493eIVnrPQvwxTVQYGbK4A"
                            }
                            
                        }
                        request({
                            method: 'Post',
                            url: url,
                            json:true,
                            headers: {
                                "content-type": "application/json",
                            },
                            body: requestData
                        })
                        .then(function(response){
                            console.log("客服消息是："+response.body.errmsg);
                            console.log("客服消息："+response.body.errcode)
                            var data = response.body.errmsg;
                        })
                    },0)
                                
                    yield getFrom.insert_content(msg.FromUserName,content)                      
                                
                    return this.body;
                      
                }
                else if(n.indexOf('邂逅') != null && (content === 'A' || content === 'a')&& n.length==2 && n.indexOf(1) === -1){
                    var sex = content.toUpperCase();
                    n+=sex;
                    var now = new Date().getTime();
                    this.status = 200;
                    this.type = 'application/xml';
                    var back ='你是男生，想邂逅男生，\n确认请回复1\n重新选择请回复2';                        
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back) 
                    yield getFrom.insert_content(msg.FromUserName,n)     
                    yield getFrom.insert_sex(sex,msg.FromUserName);                    
                    return;                    
                    
                                     

                }
                else if(n.indexOf('邂逅') != null && (content === 'B' || content === 'b')&& n.length==2 && n.indexOf(1) === -1){
                    var sex = content.toUpperCase();
                    n+=sex;
                    var now = new Date().getTime();
                    this.status = 200;
                    this.type = 'application/xml';
                    var back ='你是男生，想邂逅女生，\n确认请回复1\n重新选择请回复2';
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back)     
                    yield getFrom.insert_content(msg.FromUserName,n)  
                    yield getFrom.insert_sex(sex,msg.FromUserName) ;
                    return;                    
                                       
                                        

                }
                else if(n.indexOf('邂逅') != null && (content === 'C' || content === 'c')&& n.length==2 && n.indexOf(1) === -1){
                     var sex = content.toUpperCase();
                    n+=sex;                    
                    var now = new Date().getTime();
                    this.status = 200;
                    this.type = 'application/xml';
                    var back ='你是女生，想邂逅男生，\n确认请回复1\n重新选择请回复2';                        
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back);
                    yield getFrom.insert_content(msg.FromUserName,n)     
                    yield getFrom.insert_sex(sex,msg.FromUserName);
                    return;                    
                    
                                                      
                }
                else if(n.indexOf('邂逅') != null && (content === 'D' || content === 'd') && n.length==2 && n.indexOf(1) === -1){
                    var sex = content.toUpperCase();
                    n+=sex;
                    var now = new Date().getTime();
                    this.status = 200;
                    this.type = 'application/xml';
                    var back ='你是女生，想邂逅女生，\n确认请回复1\n重新选择请回复2';                        
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back);
                    yield getFrom.insert_content(msg.FromUserName,n)      
                    yield getFrom.insert_sex(sex,msg.FromUserName) ;
                    return;                    
                                        
                                                       
                }
                // 确认
                else if((n.indexOf('邂逅A') === 0 || n.indexOf('邂逅B') === 0 ||n.indexOf('邂逅C') === 0 || n.indexOf('邂逅D') === 0) && n.indexOf('image') === -1 &&content ==='1'){
                    var now = new Date().getTime(); 
                     n += content;
                     while(n.length >4 ){
                         n =n.substring(0,n.length-1)
                     }
                    console.log(n)
                    this.status = 200;  

                    this.type = 'application/xml';
                    var back = '哎呦，很多人想见你噢。\n请你挑一张最满意的照片发我，\n它将决定你能不能遇到那个Ta，\n作为交换你也将收到Ta准备的照片。\n温馨提示：只有一次上传照片的机会，一旦传错将无法修改。';
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back);
                    yield getFrom.insert_content(msg.FromUserName,n)                      
                    
                                       
                    return;                    
                                         
                     
                }
                // 重新选择；
                else if((n.indexOf('邂逅A') === 0 || n.indexOf('邂逅B') === 0 ||n.indexOf('邂逅C') === 0 || n.indexOf('邂逅D') === 0)&&content === '2' && n.indexOf('image') === -1 &&n.length ===3){
                    n = '邂逅'
                    var now = new Date().getTime();                        
                    this.status = 200;
                    this.type = 'application/xml';
                    var back = '欢迎来到【邂逅实验室】，'+'\n'+
                    '遇见你真好。'+'\n'+
                    '首先，请订制你想要的邂逅：'+'\n'+
                    '我是男生，想邂逅男生，回复【A】'+'\n'+
                    '我是男生，想邂逅女生，回复【B】'+'\n'+
                    '我是女生，想邂逅男生，回复【C】'+'\n'+
                    '我是女生，想邂逅女生，回复【D】';

                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back) ;
                    yield getFrom.insert_content(msg.FromUserName,n); 
                    return;                    
                                         
                            
                }
                 //    上传完图片后，确认1
                else if((n.indexOf('邂逅A1image') === 0 || n.indexOf('邂逅B1image') === 0 ||n.indexOf('邂逅C1image') === 0 || n.indexOf('邂逅D1image') === 0)&& content ==='1'&& n.indexOf('2') === -1 && n.indexOf('voice') === -1){
                    n += content;
                    while(n.length >10 ){
                        n =n.substring(0,n.length-1)
                    }

                    var now = new Date().getTime();                        
                    this.status = 200;
                    this.type = 'application/xml';
                    var back = '太棒了，Ta等的就是你，'+'\n'+
                    '这是【邂逅实验室】的'+'\n'+
                    // '第  次成功邂逅！'+'\n'+
                    '聊天前简单的了解很有必要，'+'\n'+
                    'Ta 想知道你关于以下问题的答案。'+'\n'+
                    '请先一次性回答以下问题：'+'\n'+
                    '1.你希望Ta怎么称呼你？'+'\n'+
                    '2.你最迷人的身体部位是？'+'\n'+
                    '3.你最想拥有的超能力是？'+'\n'+
                    '4.最近超想买的一样东西是？'+'\n'+
                    '5.你喜欢的人共同特征是？'
                    
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back);
                    yield getFrom.insert_content(msg.FromUserName,n);                      
                }
                 //上传完图片，重新选择2
                 else if((n.indexOf('邂逅A1image') === 0 || n.indexOf('邂逅B1image') === 0 ||n.indexOf('邂逅C1image') === 0 || n.indexOf('邂逅D1image') === 0)&& content ==='2' && n.indexOf('text') === -1 &&n.length === 9){

                     n += content;
                     while(n.length >10 ){
                         n =n.substring(0,n.length-1)
                     }
                     console.log('string\n\n'+n)
                     var now = new Date().getTime();                        
                     this.status = 200;
                     this.type = 'application/xml';
                     var back ='真的不愿意继续聊聊吗？这是今天唯一一个介绍给你的对象'+'\n'+
                     '错过就没有了，你们也很难再联系上了。'+'\n'+
                     '不愿邂逅请回复：1'+'\n'+
                     '重新考虑请回复：2'+'\n';

                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back)   
                    yield getFrom.insert_content(msg.FromUserName,n);                      
                    
                     
                 } 
                 //  重新选择2，1的分支
                 else if((n.indexOf('邂逅A1image2') === 0 || n.indexOf('邂逅B1image2') === 0 ||n.indexOf('邂逅C1image2') === 0 || n.indexOf('邂逅D1image2') === 0) && n.indexOf('text') === -1 && content === '1' && n.length === 10){

                     
                    var back ='好吧，真的很遗憾呢，那我们今天就先到这了,'+'\n'+
                    '你可以选择明天再来碰碰运气'+'\n'+
                    '或者点击下方蓝字'+'\n'+
                    '分享到朋友圈或者转发朋友'+'\n'+
                    '你将获得额外一次【邂逅】机会'+'\n'+
                    '<a href=\"http://www.wusiqing.com/webTest/TJW/TJW-weixin/app.html?'+msg.FromUserName+'\">有趣的灵魂终将相遇</a>'
                    n = '';
                    var now = new Date().getTime();                        
                    this.status = 200;
                    this.type = 'application/xml';
                    // this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back); 
                    this.body = '<xml><ToUserName><![CDATA['+ msg.FromUserName+']]></ToUserName><FromUserName><![CDATA['+ msg.ToUserName+']]></FromUserName><CreateTime><![CDATA['+ now +']]></CreateTime><MsgType>text</MsgType><Content><![CDATA['+back+']]></Content>'+'</xml>'
                    yield getFrom.zore_play(msg.FromUserName);
                    yield getFrom.insert_content(msg.FromUserName,n);                      
                    
                     

                 }   
                 //  重新选择2，2的分支
                 else if((n.indexOf('邂逅A1image2') === 0 || n.indexOf('邂逅B1image2') === 0 ||n.indexOf('邂逅C1image2') === 0 || n.indexOf('邂逅D1image2') === 0) && n.indexOf('text') === -1 && n.indexOf('image1') === -1 && content === '2' && n.length === 10){

                    n += content;
                     while(n.length >11 ){
                         n =n.substring(0,n.length-1)
                     }
                     console.log("\nstring\n"+n)
                     var back ='请重新选择'+'\n'+
                     '继续聊 请回复“1”，'+'\n'+
                     '没兴趣 请回复“2”。'+'\n';
                     var now = new Date().getTime();                        
                     this.status = 200;
                     this.type = 'application/xml';
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back); 
                    yield getFrom.insert_content(msg.FromUserName,n);                      
                    
                     
                 }
                 // 重新选择2，2，1的分支；
                 else if( (n.indexOf('邂逅A1image22') === 0 || n.indexOf('邂逅B1image22') === 0 || n.indexOf('邂逅C1image22') === 0 || n.indexOf('邂逅D1image22') === 0)  && content === '1' && n.indexOf('text') === -1){
                     
                     
                     n = '邂逅A1image1';

                     var now = new Date().getTime();                        
                     this.status = 200;
                     this.type = 'application/xml';
                     var back = '太棒了，Ta等的就是你，'+'\n'+
                     '这是【邂逅实验室】的'+'\n'+
                     '第  次成功邂逅！'+'\n'+
                     '聊天前简单的了解很有必要，'+'\n'+
                     'Ta 想知道你关于以下问题的答案。'+'\n'+
                     '请先一次性回答以下问题：'+'\n'+
                     '1.你希望Ta怎么称呼你？'+'\n'+
                     '2.你最迷人的身体部位是？'+'\n'+
                     '3.你最想拥有的超能力是？'+'\n'+
                     '4.最近超想买的一样东西是？'+'\n'+
                     '5.你喜欢的人共同特征是？'
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back)  ;
                    yield getFrom.insert_content(msg.FromUserName,n);                      
                    return;                    
                    

                 }
                 // 重新选择2，2，2的分支；
                 else if((n.indexOf('邂逅A1image22') === 0 || n.indexOf('邂逅B1image22') === 0 || n.indexOf('邂逅C1image22') === 0 || n.indexOf('邂逅D1image22') === 0)  && content === '2' && n.indexOf('text') === -1){
                     n = '邂逅A1image2';
                     var now = new Date().getTime();                        
                     this.status = 200;
                     this.type = 'application/xml';
                     var back ='真的不愿意继续聊聊吗？这是今天唯一一个介绍给你的对象'+'\n'+
                     '错过就没有了，你们也很难再联系上了。'+'\n'+
                     '不愿邂逅请回复：1'+'\n'+
                     '重新考虑请回复：2'+'\n';

                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back)  ;
                    yield getFrom.insert_content(msg.FromUserName,n);  
                    return;                    
                    

                 } 
                 // 存储留言1；
                else if((n.indexOf('邂逅A1image1') === 0 || n.indexOf('邂逅B1image1') === 0 ||n.indexOf('邂逅C1image1') === 0 || n.indexOf('邂逅D1image1') === 0) && n.indexOf('voice') === -1 && content != '' && n.length == 10){
                    // 存储留言   
                    n += msg.MsgType;
                    while(n.length >14 ){
                         n = n.substring(0,n.length-1)
                    }
                    this.status = 200;
                    this.type = 'application/xml';
                    yield getFrom.insert_msg(msg.FromUserName,msg.Content)
                    // 发送其他留言,必须要匹配到同一张图片的人；                
                    var needopenid = yield getFrom.getNeedOpenIdFromDB(msg.FromUserName);
                    var back_msg = yield getFrom.random_msg(needopenid);
                    
                        // 获取access_token
                    var access_token_0= yield getKefu_acc.toJson(wechat_file);

                    setTimeout(function(){
                                
                            var url = 'https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token='+access_token_0;
                            // var msgUser = 'oRFFw07pJC1DfxCv7N5oRU0ANePw';
                            var requestData ={
                                touser:msg.FromUserName,
                                msgtype:"text",
                                "text":{
                                    "content":back_msg
                                }
                                
                            }
                            request({
                                method: 'Post',
                                url: url,
                                json:true,
                                headers: {
                                    "content-type": "application/json",
                                },
                                body: requestData
                            })
                            .then(function(response){
                                console.log("客服消息是："+response.body.errmsg);
                                console.log("客服消息："+response.body.errcode)
                                var data = response.body.errmsg;
                            })
                        },0)
                    var back ='感谢你认真回答，这是Ta的答案。\n'+
                        '接下来请你发一段展示自己的语音\n'+
                        '如果不知道说什么，可以跟Ta聊聊\n'+
                        '\“今日话题：：长大总是在一瞬间，你什么时候觉得自己变老了？\”，'+
                        '或者唱一首应景的歌。'+'\n'+
                        '请注意：'+'\n'+
                        '你只有一次上传语音的机会，一旦传错将无法修改。'
                                      
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back) ;
                    yield getFrom.insert_content(msg.FromUserName,n);  
                    
                  
                    
                  
                                       
                     

                }
                // 经历语音环节后，需要输入1来确认
                else if((n.indexOf('邂逅A1image1text') === 0 || n.indexOf('邂逅B1image1text') === 0 ||n.indexOf('邂逅C1image1text') === 0 || n.indexOf('邂逅D1image1text') === 0) && n.indexOf('voice') === 14  &&  content == '1' &&n.indexOf('2') === -1){
                    var now = new Date().getTime();
                    this.status = 200;
                    this.type = 'application/xml';
                    var back ='哈哈，无声胜有声，说太多就不浪漫了。\n'+
                        '最后给Ta写下一段想说的话吧。\n'+
                        '如果觉得Ta还算有趣，希望认识。\n'+
                        '这是交换【联系方式】的最后机会\n'
                    n +='1';
                    while(n.length >20 ){
                        n = n.substring(0,n.length-1)
                    }
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back);
                    yield getFrom.insert_content(msg.FromUserName,n);                      
                    
                }
                // 经历语音环节后，需要输入2来重新选择
                else if((n.indexOf('邂逅A1image1text') === 0 || n.indexOf('邂逅B1image1text') === 0 ||n.indexOf('邂逅C1image1text') === 0 || n.indexOf('邂逅D1image1text') === 0) && n.indexOf('voice') === 14  &&  content == '2' && n.length == 19){
                    var now = new Date().getTime();
                    this.status = 200;
                    this.type = 'application/xml';
                    var back ='真的不愿意继续聊聊吗？ '+'\n'+
                    '错过了你们就很难再联系上了'+'\n'+
                    '不愿邂逅请回复：【1】'+'\n'+
                    '重新考虑请回复：【2】'
                    n +='2';     
                    while(n.length >20 ){
                        n = n.substring(0,n.length-1)
                    }         
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back);
                    yield getFrom.insert_content(msg.FromUserName,n);                                          
                }
                // 重新选择21
                else if((n.indexOf('邂逅A1image1textvoice2') === 0 || n.indexOf('邂逅B1image1textvoice2') === 0 ||n.indexOf('邂逅C1image1textvoice2') === 0 || n.indexOf('邂逅D1image1textvoice2') === 0) &&  content ==='1'&&n.indexOf('22') ===-1 && n.length === 20){
                    var now = new Date().getTime();
                    this.status = 200;
                    this.type = 'application/xml';
                    var back ='好吧，很遗憾这次你们互相错过了'+'\n'+
                    '你可以选择明天再来碰碰运气'+'\n'+
                    '或者点击下方蓝字'+'\n'+
                    '分享到朋友圈或者转发朋友'+'\n'+
                    '你将获得额外一次【邂逅】机会'+'\n'+
                    '<a href=\"http://www.wusiqing.com\">有趣的灵魂终将相遇</a>'
                    n = '';
                   this.body = '<xml><ToUserName><![CDATA['+ msg.FromUserName+']]></ToUserName><FromUserName><![CDATA['+ msg.ToUserName+']]></FromUserName><CreateTime><![CDATA['+ now +']]></CreateTime><MsgType>text</MsgType><Content><![CDATA['+back+']]></Content>'+'</xml>';
                    yield getFrom.insert_content(msg.FromUserName,n); 
                    yield getFrom.zore_play(msg.FromUserName)              
                    
                }
                // 重新考虑22
                else if((n.indexOf('邂逅A1image1textvoice') === 0 || n.indexOf('邂逅B1image1textvoice') === 0 ||n.indexOf('邂逅C1image1textvoice') === 0 || n.indexOf('邂逅D1image1textvoice') === 0) && n.indexOf('2') === 19  &&  content =='2' && n.length == 20){
                    var now = new Date().getTime();
                    this.status = 200;
                    this.type = 'application/xml';
                    var back ='请重新选择'+'\n'+
                    '继续聊请回复【1】'+'\n'+
                    '没兴趣请回复【2】'
                    n += '2';
                    while(n.length >21 ){
                        n = n.substring(0,n.length-1)
                    }
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back);
                    yield getFrom.insert_content(msg.FromUserName,n);  
                    
                    
                }
                // 重新考虑2，2，2没兴趣
                else if((n.indexOf('邂逅A1image1textvoice22') === 0 || n.indexOf('邂逅B1image1textvoice22') === 0 ||n.indexOf('邂逅C1image1textvoice22') === 0 || n.indexOf('邂逅D1image1textvoice22') === 0)   &&  content =='2' && n.length == 21){
                    var now = new Date().getTime();
                    this.status = 200;
                    this.type = 'application/xml';
                    var back ='好吧，很遗憾这次你们互相错过了'+'\n'+
                    '你可以选择明天再来碰碰运气'+'\n'+
                    '或者点击下方蓝字'+'\n'+
                    '分享到朋友圈或者转发朋友'+'\n'+
                    '你将获得额外一次【邂逅】机会'+'\n'+
                    '<a href=\"http://www.wusiqing.com/webTest/TJW/TJW-weixin/app.html?'+msg.FromUserName+'\">有趣的灵魂终将相遇</a>'
                    n = '';
                   this.body = '<xml><ToUserName><![CDATA['+ msg.FromUserName+']]></ToUserName><FromUserName><![CDATA['+ msg.ToUserName+']]></FromUserName><CreateTime><![CDATA['+ now +']]></CreateTime><MsgType>text</MsgType><Content><![CDATA['+back+']]></Content>'+'</xml>';
                    yield getFrom.insert_content(msg.FromUserName,n);  
                    yield getFrom.zore_play(msg.FromUserName)              
                    
                }
                // 重新考虑2，2，1，确认再聊
                else if((n.indexOf('邂逅A1image1textvoice22') === 0 || n.indexOf('邂逅B1image1textvoice22') === 0 ||n.indexOf('邂逅C1image1textvoice22') === 0 || n.indexOf('邂逅D1image1textvoice22') === 0)  &&  content =='1' && n.length === 21){
                    var now = new Date().getTime();
                    this.status = 200;
                    this.type = 'application/xml';
                    var back ='聊到这里相信你们已经基本认识了'+'\n'+
                    '赘述太多反而会变得不那么浪漫'+'\n'+
                    '最后给Ta留下一段想说的文字吧'+'\n'+
                    '如果觉得Ta还算有趣，希望认识'+'\n'+
                    '这是交换【联系方式】的最后机会.'
                    n = '邂逅A1image1textvoice'+'1';
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back);
                    yield getFrom.insert_content(msg.FromUserName,n);     
                }
                // 留言2；
                else if( (n.indexOf('邂逅A1image1textvoice1') === 0 || n.indexOf('邂逅B1image1textvoice1') === 0 ||n.indexOf('邂逅C1image1textvoice1') === 0 || n.indexOf('邂逅D1image1textvoice1') === 0) &&n.length == 20  &&  content != ''){
                    
                    this.status = 200;
                    this.type = 'application/xml';
                    n += msg.MsgType;
                     
                    // 发送其他留言,必须要匹配到同一张图片的人；                                     
                    var needopenid = yield getFrom.getNeedOpenIdFromDB(msg.FromUserName);
                    //  var back_msg_1 = yield getFrom.random_msg(needopenid)
                
                    var back_msg = yield getFrom.random_msg_nd(needopenid);
                        
                   

                    
                         // 获取access_token
                    var access_token_0= yield getKefu_acc.toJson(wechat_file);
                    setTimeout(function(){
                                
                            var url = 'https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token='+access_token_0;
                            var requestData ={
                                touser:msg.FromUserName,
                                msgtype:"text",
                                "text":{
                                    "content":back_msg
                                }
                                
                            }
                            request({
                                method: 'Post',
                                url: url,
                                json:true,
                                headers: {
                                    "content-type": "application/json",
                                },
                                body: requestData
                            })
                            .then(function(response){
                                console.log("客服消息是："+response.body.errmsg);
                                console.log("客服消息："+response.body.errcode)
                                var data = response.body.errmsg;
                            })
                    },0)
                    var back = '这是Ta在实验室留下的最后的话，'+'\n'+
                                    '是不是很想见Ta呢？'+'\n'+
                                    '脑补千百遍，不如线下见一面。'+'\n'+
                                    '4月11日晚19:00'+'\n'+
                                    '在北师会同食街的8度俱乐部'+'\n'+
                                    '（4月12日开放北理专场报名）'+'\n'+
                                    '我们精心策划了一场线下邂逅'+'\n'+
                                    '如果你希望参与这场线下活动'+'\n'+
                                    '请及时输入'+'\n'+
                                    '【姓名+手机号码】进行报名'+'\n'+
                                    '如：“小唐+136xxxx6542” '+'\n'+
                                    '双方均填入准确信息即为成功报名'+'\n'+
                                    '任何一方放弃填写均不生效'
                         
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back);
                    yield getFrom.insert_content(msg.FromUserName,n);
                    yield getFrom.insert_msg_nd(msg.FromUserName,msg.Content); 
                    return;
                    
                
                                        
                     
                     
                    
                     
                }
                // 结束语
                else if(n.indexOf('邂逅A1image1textvoice1text') === 0 || n.indexOf('邂逅B1image1textvoice1text') === 0  || n.indexOf('邂逅C1image1textvoice1text') === 0 || n.indexOf('邂逅D1image1textvoice1text') === 0  && content != ''&& n.length==24){
                    yield getFrom.insert_contact(content,msg.FromUserName);
                    // var hi_contact = yield getFrom.getContactFromDB(msg.FromUserName);
                    // console.log('hi_c'+hi_contact)
                    // var temp= yield getFrom.getNeedOpenIdFromDB(msg.FromUserName) 
                     
                    // var she_contact = yield getFrom.getContactFromDB(temp);
                    // console.log('she_c'+she_contact)

                    var p = /[0-9]/;
                    var b = p.test(content);
                    this.status = 200;
                    this.type = 'application/xml';
                    var now = new Date().getTime();
                    

                    if(b && content.length<17&&content.length>12){
                        var back= '收到你的报名信息啦！'+'\n'+
                                '请添加客服微信：TJWstation'+'\n'+
                                '确认信息完成报名！'+'\n'+
                                '我在【邂逅实验室】等你喔！\n'+
                                '预祝你邂逅愉快～\n'+
                                '如果还想认识更多朋友'+'\n'+
                                '点击下方蓝字'+'\n'+
                                '分享到朋友圈'+'\n'+
                                '你将获得额外一次【邂逅】机会'+'\n'+
                                '<a href=\"http://www.wusiqing.com/webTest/TJW/TJW-weixin/app.html?'+msg.FromUserName+'\" >有趣的灵魂终将相遇</a>'
                        this.body = '<xml><ToUserName><![CDATA['+ msg.FromUserName+']]></ToUserName><FromUserName><![CDATA['+ msg.ToUserName+']]></FromUserName><CreateTime><![CDATA['+ now +']]></CreateTime><MsgType>text</MsgType><Content><![CDATA['+back+']]></Content>'+'</xml>';
                        n='';
                        yield getFrom.insert_content(msg.FromUserName,n);   
                        yield getFrom.zore_play(msg.FromUserName); 
                        
                    }else{
                        var back='抱歉，你未能及时填写报名信息或填写有误'+'\n'+
                        '这次的报名并未生效'+'\n'+
                        '你可以选择明天再来碰碰运气'+'\n'+
                        '或者点击下方蓝字'+'\n'+
                        '分享到朋友圈'+'\n'+
                        '你将获得额外一次【邂逅】机会'+'\n'+
                        '<a href=\"http://www.wusiqing.com/webTest/TJW/TJW-weixin/app.html?'+msg.FromUserName+'\" >有趣的灵魂终将相遇</a>'
                        // var now = new Date().getTime();
                        this.body = '<xml><ToUserName><![CDATA['+ msg.FromUserName+']]></ToUserName><FromUserName><![CDATA['+ msg.ToUserName+']]></FromUserName><CreateTime><![CDATA['+ now +']]></CreateTime><MsgType>text</MsgType><Content><![CDATA['+back+']]></Content>'+'</xml>'   ;
                        n='';
                        yield getFrom.insert_content(msg.FromUserName,n);   
                        yield getFrom.zore_play(msg.FromUserName);                  
                    }
                     

                }
                
                else{

                    var now = new Date().getTime();
                    this.status = 200;
                    this.type = 'application/xml';
                    var back = '请按照确认的方式 输入';
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back);
                    console.log("that.body:"+this.body);

                }  

            }   
           
                 //    图片
            else if(msg.MsgType === 'image' && (n.indexOf('邂逅A1') === 0 || n.indexOf('邂逅B1') === 0 ||n.indexOf('邂逅C1') === 0 || n.indexOf('邂逅D1') === 0) ){
                    var now = new Date().getTime()                   
                         
                    n += msg.MsgType;
                    console.log('图片：'+n)
                    while(n.length >9 ){
                        n =n.substring(0,n.length-1)
                    }
                         
                    yield getFrom.insert_img(msg.FromUserName,msg.PicUrl,msg.MediaId);
                    this.status = 200;
                    this.type = 'application/xml';


                    var sex_j = yield getFrom.getSexFromDB(msg.FromUserName)

                        if(sex_j === 'B'){
                            var a_random = yield getFrom.random_img('C',msg.FromUserName)
                        }else if(sex_j === 'C'){
                            var a_random = yield getFrom.random_img('B',msg.FromUserName)
                        }else{
                            var a_random = yield getFrom.random_img(sex_j,msg.FromUserName)     
                        }




                    var needopenid = yield getFrom.getNeedOpenIdFromDB(msg.FromUserName)
                    // 获取needopenID图片
                    var access_token_0= yield getKefu_acc.toJson(wechat_file);
                    

                    setTimeout(function(){
                                    
                            var url = 'https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token='+access_token_0;
                            var msgUser = 'oRFFw07pJC1DfxCv7N5oRU0ANePw';
                            var requestData ={
                                touser:msg.FromUserName,
                                msgtype:"image",
                                image:{
                                    "media_id":a_random.imgId
                                }
                            
                            }
                          
                            request({
                                method: 'Post',
                                url: url,
                                json:true,
                                headers: {
                                    "content-type": "application/json",
                                },
                                body: requestData
                            })
                            .then(function(response){
                                console.log("客服消息是："+response.body.errmsg);
                                console.log("客服消息："+response.body.errcode)
                                var data = response.body.errmsg;
                            })
                        },0);
                    var back = '照片选得真棒。\n根据你的要求我找到了Ta，\n请确认一下照片，是不是对的人。\n慎重考虑噢，错过就很难再遇到了。\n继续聊 请回复【1】\n没兴趣 请回复【2】';
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back);    
                    // 当成功后，双发匹配对方的openid，
                    // A主动匹配到对方
                    yield getFrom.insert_needOpenId(a_random.openId,msg.FromUserName);
                    // 对方被动匹配到A
                    yield getFrom.insert_needOpenId(msg.FromUserName,a_random.openId);    
                    // 添加判断
                    yield getFrom.insert_content(msg.FromUserName,n);
                    
            }
         
            else if(msg.MsgType === 'voice' && (n.indexOf('邂逅A1image1text') === 0 || n.indexOf('邂逅B1image1text') === 0 ||n.indexOf('邂逅C1image1text') === 0 || n.indexOf('邂逅D1image1text') === 0)){

                    var now = new Date().getTime()
                    this.status = 200;
                    this.type = 'application/xml';
                    n += msg.MsgType;
                    while(n.length >19 ){
                         n =n.substring(0,n.length-1)
                     }

                    yield getFrom.insert_voiceId(msg.FromUserName,msg.MediaId);

                    var needopenid = yield getFrom.getNeedOpenIdFromDB(msg.FromUserName)
                    var back_msg = yield getFrom.random_voice(needopenid);                 
                    var access_token_0= yield getKefu_acc.toJson(wechat_file);
                        
                    setTimeout(function(){
                            var url = 'https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token='+access_token_0;
                                // var msgUser = 'oRFFw07pJC1DfxCv7N5oRU0ANePw';
                                var requestData ={
                                    touser:msg.FromUserName,
                                    msgtype:"voice",
                                    voice:
                                    {
                                      "media_id":back_msg
                                    }
                                
                                }
                                request({
                                    method: 'Post',
                                    url: url,
                                    json:true,
                                    headers: {
                                        "content-type": "application/json",
                                    },
                                    body: requestData
                                })
                                .then(function(response){
                                    console.log("客服消息是："+response.body.errmsg);
                                    console.log("客服消息："+response.body.errcode)
                                    var data = response.body.errmsg;
                                })

                        },0);
                    var back = '听到Ta对你说的话了吗？\n聊到这里你们已经基本了解，\n请根据你的喜好进行选择，\n继续聊 请回复【1】\n没兴趣 请回复【2】';
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back);
                    yield getFrom.insert_content(msg.FromUserName,n);                      
                      
                }
                 
                else{

                    var now = new Date().getTime();
                    this.status = 200;
                    this.type = 'application/xml';
                    var back = '请按照确认的方式 输入,如果还是原来的问题，机器出了问题，请重新输入【邂逅】';
                    n ='';
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back);
                    yield getFrom.insert_content(msg.FromUserName,n); 
                    
                    console.log("that.body:"+this.body);

                }  

        }

        else if(playcount === 0 && msg.Content === '邂逅'){
                var now = new Date().getTime();
                this.status = 200;
                this.type = 'application/xml';
                var back = '很抱歉，你今天的机会已经用完了'+'\n'+
                '也留点机会给其他有缘人吧'+'\n'+
                '你可以选择明天再来碰碰运气'+'\n'+
                '或者<a href=\"http://www.wusiqing.com/webTest/TJW/TJW-weixin/app.html?'+msg.FromUserName+'\" >【点击此处】</a>'+'\n'+
                '分享到朋友圈'+'\n'+
                '你将获得额外1次【邂逅】机会';
                // this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back)
                this.body = '<xml><ToUserName><![CDATA['+ msg.FromUserName+']]></ToUserName><FromUserName><![CDATA['+ msg.ToUserName+']]></FromUserName><CreateTime><![CDATA['+ now +']]></CreateTime><MsgType>text</MsgType><Content><![CDATA['+back+']]></Content>'+'</xml>'
                console.log("that.body:"+this.body)
            }
            // else if(msg.Content === '2018'){

            // }
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

