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



// 字符匹配存储
var string = new Array();
// var i = 0 ;

// 存留言数组
var Save_msgs = new Array();
Save_msgs[0] ='1.咸鱼\n2.布拉格\n3.晒太阳\n4.北理老腊肉\n5.What are Words';
Save_msgs[1] ='1.咸鱼\n2.布拉格\n3.晒太阳\n4.北理老腊肉\n5.What are Words';
Save_msgs[2] ='1.咸鱼\n2.布拉格\n3.晒太阳\n4.北理老腊肉\n5.What are Words';
Save_msgs[3] ='1.咸鱼\n2.布拉格\n3.晒太阳\n4.北理老腊肉\n5.What are Words';
Save_msgs[4] ='1.咸鱼\n2.布拉格\n3.晒太阳\n4.北理老腊肉\n5.What are Words';

// 存图片数组
var Save_imgUrl = new Array();
Save_imgUrl[0] = 'http://mmbiz.qpic.cn/mmbiz_jpg/icLZmYpBjdOvakHqPbW5yIHZmjQMicUWw9L7t1eJiaP9N8VEvBxrPT5MRtI7DZRys8B3eNfHLdQ6RyNXBbZibS4p6Q/0'
Save_imgUrl[1] = 'http://mmbiz.qpic.cn/mmbiz_jpg/icLZmYpBjdOvakHqPbW5yIHZmjQMicUWw9ehVJX0PxobWmOV7Y5oYWOh4KlFKHPmT1ySS92jcuuImW911icpW1WIQ/0'
Save_imgUrl[2] = 'http://mmbiz.qpic.cn/mmbiz_jpg/icLZmYpBjdOvakHqPbW5yIHZmjQMicUWw95yHaYGvULUibdLEnF4v09SbQsXDsSN2lOPHHKLvbrcsgZcCm1KQHEZg/0'
Save_imgUrl[3] = 'http://mmbiz.qpic.cn/mmbiz_jpg/icLZmYpBjdOvakHqPbW5yIHZmjQMicUWw9VzO7uiaO9VSY4ybLa0jWmJVhBDKOkZ1JJpcqQYdiajUrKvNtXOasBNZQ/0'
Save_imgUrl[4] = 'http://mmbiz.qpic.cn/mmbiz_jpg/icLZmYpBjdOvakHqPbW5yIHZmjQMicUWw9ibFYcXVKhzkvexeemew257icFhWfeEFFC0w0ExywM99HI397wKyYibIag/0'

// 存语音
var Save_voice = new Array();
Save_voice[0]='QszlWuUhFlU6eIutiYXuSzYHcFxAZtoNdaIVNT2TLdKNV8OfnFeSYSh5vd82taid';
Save_voice[1]='thoNPHpPUWH5rUY4yKJCf5PhuyyS8_3wxGgkxRdfkV2elx7NxglmSxSZ6fJUEQRA';

// 存最后一个留言
var Save_msg_nd = new Array();
Save_msg_nd[0] ='很高兴认识你，希望有机会和你交个朋友，我的微信号是：3';
Save_msg_nd[1] ='很高兴认识你，希望有机会和你交个朋友，我的微信号是：2';
Save_msg_nd[2] ='很高兴认识你，希望有机会和你交个朋友，我的微信号是：3';
Save_msg_nd[3] ='很高兴认识你，希望有机会和你交个朋友，我的微信号是：2';
Save_msg_nd[4] ='很高兴认识你，希望有机会和你交个朋友，我的微信号是：1';




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
          
            
                if(content === '邂逅' && (n == null || n == '')){
                    var now = new Date().getTime();
                    this.status = 200;
                    this.type = 'application/xml';
                    var back = '欢迎来到【邂逅实验室】，希望你能在这里邂逅到有趣的灵魂。'+'\n'+
                                '首先请你做一个关乎终身大事的选择：'+'\n'+
                                '我是男生，想邂逅男生，请回复A；'+'\n'+
                                '我是男生，想邂逅女生，请回复B；'+'\n'+
                                '我是女生，想邂逅男生，请回复C；'+'\n'+
                                '我是女生，想邂逅女生，请回复D。';
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back);
                                
                    yield getFrom.insert_content(msg.FromUserName,content)                      
                                
                    return this.body;
                      
                }else if(n.indexOf('邂逅') != null && (content === 'A' || content === 'a')&& n.length==2 && n.indexOf(1) === -1){
                    var sex = content.toUpperCase();
                    n+=sex;
                    var now = new Date().getTime();
                    this.status = 200;
                    this.type = 'application/xml';
                    var back ='你是男生，想邂逅男生，确认请回复1，重新选择请回复2，5分钟不回复就当做你确认了哦!';                        
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back) 
                    yield getFrom.insert_content(msg.FromUserName,n)     
                    yield getFrom.insert_sex(sex,msg.FromUserName)
                                     

                }else if(n.indexOf('邂逅') != null && (content === 'B' || content === 'b')&& n.length==2 && n.indexOf(1) === -1){
                    var sex = content.toUpperCase();
                    n+=sex;
                    var now = new Date().getTime();
                    this.status = 200;
                    this.type = 'application/xml';
                    var back ='你是男生，想邂逅女生，确认请回复1，重新选择请回复2，5分钟不回复就当做你确认了哦!';
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back)     
                    yield getFrom.insert_content(msg.FromUserName,n)  
                    yield getFrom.insert_sex(sex,msg.FromUserName)                    
                                        

                }else if(n.indexOf('邂逅') != null && (content === 'C' || content === 'c')&& n.length==2 && n.indexOf(1) === -1){
                     var sex = content.toUpperCase();
                    n+=sex;                    
                    var now = new Date().getTime();
                    this.status = 200;
                    this.type = 'application/xml';
                    var back ='你是女生，想邂逅男生，确认请回复1，重新选择请回复2，5分钟不回复就当做你确认了哦!';                        
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back);
                    yield getFrom.insert_content(msg.FromUserName,n)     
                    yield getFrom.insert_sex(sex,msg.FromUserName)
                                                      
                }else if(n.indexOf('邂逅') != null && (content === 'D' || content === 'd') && n.length==2 && n.indexOf(1) === -1){
                    var sex = content.toUpperCase();
                    n+=sex;
                    var now = new Date().getTime();
                    this.status = 200;
                    this.type = 'application/xml';
                    var back ='你是女生，想邂逅女生，确认请回复1，重新选择请回复2，5分钟不回复就当做你确认了哦!';                        
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back);
                    yield getFrom.insert_content(msg.FromUserName,n)      
                    yield getFrom.insert_sex(sex,msg.FromUserName)                     
                                                       
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
                    var back = '恭喜你成功加入今天的【邂逅实验室】！'+'\n'+
                    '我将在实验室里努力挑选一位有缘人与你邂逅，'+'\n'+
                    '接下来请你挑选一张你认为满意的本人照片发给我们，'+'\n'+
                    '我们将用这张照片作为媒介，让你们进行一轮初步交流，'+'\n'+
                    '所以一定要翻遍相册找张你非常满意的照片噢！'+'\n'+
                    '温馨提示：只有一次上传照片的机会，一旦传错将无法修改。'
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back)  
                    yield getFrom.insert_content(msg.FromUserName,n)                      
                     
                }
                // 重新选择；
                else if((n.indexOf('邂逅A') === 0 || n.indexOf('邂逅B') === 0 ||n.indexOf('邂逅C') === 0 || n.indexOf('邂逅D') === 0)&&content === '2' && n.indexOf('image') === -1 &&n.length ===3){
                    n = '邂逅'
                    var now = new Date().getTime();                        
                    this.status = 200;
                    this.type = 'application/xml';
                    var back = '请重新选择：'+'\n'+
                    '我是男生，想邂逅男生，请回复A；'+'\n'+
                    '我是男生，想邂逅女生，请回复B；'+'\n'+
                    '我是女生，想邂逅男生，请回复C；'+'\n'+
                    '我是女生，想邂逅女生，请回复D。';

                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back) ;
                    yield getFrom.insert_content(msg.FromUserName,n);                      
                            
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
                    var back = '恭喜你们成为邂逅实验室的'+'\n'+
                    '第XX对有缘人！'+'\n'+
                    '聊天前简单的自我介绍很有必要'+'\n'+
                    '请先一次性回答以下问题：'+'\n'+
                    '1.该怎么称呼你？'+'\n'+
                    '2.你是北师、北理、UIC的学生或是其他身份？'+'\n'+
                    '3.一般怎么安排自己的周末？'+'\n'+
                    '4.最喜欢的一首歌？'+'\n'+
                    '5.最向往的城市？'
                    
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
                    '分享到朋友圈并截图发送至后台'+'\n'+
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
                    var back = '恭喜你们成为邂逅实验室第 '+' undefiend'+'对有缘人，对方也希望跟你认识，'+'\n'+
                    '接下来请你们各自按照以下格式回复做一个自我介绍吧，当然对方也会向你介绍自己。'+'\n'+
                    '1.该怎么称呼你？'+'\n'+
                    '2.你是北师、北理、UIC的学生或是其他身份？'+'\n'+
                    '3.一般怎么安排自己的周末？'+'\n'+
                    '4.最喜欢的一首歌？'+'\n'+
                    '5.最向往的城市？'
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back)  ;
                    yield getFrom.insert_content(msg.FromUserName,n);                      
                    

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
                    

                 } 
                 // 存储留言1；
                else if((n.indexOf('邂逅A1image1') === 0 || n.indexOf('邂逅B1image1') === 0 ||n.indexOf('邂逅C1image1') === 0 || n.indexOf('邂逅D1image1') === 0) && n.indexOf('voice') === -1 && content != '' && n.length == 10){
                     // 存储留言   
                     // temp_msgs = content;
                     n += msg.MsgType;
                     while(n.length >14 ){
                         n = n.substring(0,n.length-1)
                     }

    
                    // 发送其他留言,必须要匹配到同一张图片的人；     
                    var needopenid = yield getFrom.getNeedOpenIdFromDB(msg.FromUserName);                
                     var back_msg = yield getFrom.random_msg(needopenid);
                     this.status = 200;
                     this.type = 'application/xml';
                     var back ='\n\n'+'【'+'\n'+back_msg+'\n'+'】'+'\n\n\n'+'对方的自我介绍你也收到了'+'\n'+
                     '接下来请你发一段展示自己的语音'+'\n'+
                     '如果不知道说什么，可以跟Ta聊聊'+'\n'+
                     '\“每日更新话题\”，'+'\n'+
                     '或者唱一首应景的歌。'+'\n'+
                     '请注意：'+'\n'+
                     '1、语音长度需超过X秒，否则将影响系统传输；'+'\n'+
                     '2、你只有一次上传语音的机会，一旦传错将无法修改。'+'\n'+
                     '3、收到语音后想继续聊请回复【1】，没兴趣请回复【2】'
                                   
                     this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back) ;
                    yield getFrom.insert_content(msg.FromUserName,n);   
                    yield getFrom.insert_msg(msg.FromUserName,msg.Content)
                                       
                     

                }
                // 经历语音环节后，需要输入1来确认
                else if((n.indexOf('邂逅A1image1text') === 0 || n.indexOf('邂逅B1image1text') === 0 ||n.indexOf('邂逅C1image1text') === 0 || n.indexOf('邂逅D1image1text') === 0) && n.indexOf('voice') === 14  &&  content == '1' &&n.indexOf('2') === -1){
                    var now = new Date().getTime();
                    this.status = 200;
                    this.type = 'application/xml';
                    var back ='聊到这里相信你们已经基本认识了'+'\n'+
                    '赘述太多反而会变得不那么浪漫'+'\n'+
                    '最后给Ta留下一段想说的文字吧'+'\n'+
                    '如果觉得Ta还算有趣，希望认识'+'\n'+
                    '这是交换【联系方式】的最后机会.'
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
                    '分享到朋友圈并截图发送至后台'+'\n'+
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
                    '分享到朋友圈并截图发送至后台'+'\n'+
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
                
                
                
                else if( (n.indexOf('邂逅A1image1textvoice1') === 0 || n.indexOf('邂逅B1image1textvoice1') === 0 ||n.indexOf('邂逅C1image1textvoice1') === 0 || n.indexOf('邂逅D1image1textvoice1') === 0) &&n.length == 20  &&  content != ''){
                     
                    var needopenid = yield getFrom.getNeedOpenIdFromDB(msg.FromUserName);                
                     var back_msg = yield getFrom.random_msg_nd(needopenid);
                     this.status = 200;
                     this.type = 'application/xml';
                     var back = '\n\n'+'【'+back_msg+'】'+'\n\n\n'+
                     '当你收到对方以上留言的时候'+'\n'+
                     '今天【邂逅实验室】的线上之旅就快要结束了'+'\n'+
                     '为了纪念这场有趣的实验我们策划了一场线下邂逅'+'\n'+
                     '在我们精心挑选的时间和场地（此处待定）。 '+'\n'+
                     '如果你希望参与这场线下活动'+'\n'+
                     '请在30分钟内留下'+'\n'+
                     '【姓名+手机号码】 进行报名'+'\n'+
                     '双方均填入准确信息即为成功报名'+'\n'+
                     '任何一方放弃填写均不生效'
                     
                    n += msg.MsgType;
                     
                     this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back);
                    yield getFrom.insert_content(msg.FromUserName,n);  
                    yield getFrom.insert_msg_nd(msg.FromUserName,msg.Content);
                                        
                     

                }
                // 结束语
                else if(n.indexOf('邂逅A1image1textvoice1text') !== null || n.indexOf('邂逅B1image1textvoice1text') !== null || n.indexOf('邂逅C1image1textvoice1text') !== null || n.indexOf('邂逅D1image1textvoice1text') !== null && content != ''){
                    yield getFrom.insert_contact(content,msg.FromUserName);
                    var hi_contact = yield getFrom.getContactFromDB(msg.FromUserName);
                    var temp = yield getFrom.getNeedOpenIdFromDB(msg.FromUserName) 
                    var she_contact = yield getFrom.getContactFromDB(temp);

                    this.status = 200;
                    this.type = 'application/xml';

                    if(hi_contact != '' && she_contact != '' ){
                    var back= '恭喜你们，你们已经成功报名'+'\n'+
                            '【邂逅实验室】的线下活动，'+'\n'+
                            '请添加客服微信：TJWstation接收后续通知'+'\n'+
                            '预祝你们见面愉快！'+'\n'+
                            '如果还想认识更多朋友'+'\n'+
                            '点击下方蓝字'+'\n'+
                            '分享到朋友圈并截图发送至后台'+'\n'+
                            '你将获得额外一次【邂逅】机会'+'\n'+
                            '<a href=\"http://www.wusiqing.com/webTest/TJW/TJW-weixin/app.html?'+msg.FromUserName+'\" >有趣的灵魂终将相遇</a>'
                    var now = new Date().getTime();
                    this.body = '<xml><ToUserName><![CDATA['+ msg.FromUserName+']]></ToUserName><FromUserName><![CDATA['+ msg.ToUserName+']]></FromUserName><CreateTime><![CDATA['+ now +']]></CreateTime><MsgType>text</MsgType><Content><![CDATA['+back+']]></Content>'+'</xml>'
                        
                }else if(hi_contact != '' && she_contact == ''){
                    var back='抱歉，对方未能及时填写报名信息'+'\n'+
                    '这次的报名并未生效'+'\n'+
                    '你可以选择明天再来碰碰运气'+'\n'+
                    '或者点击下方蓝字'+'\n'+
                    '分享到朋友圈并截图发送至后台'+'\n'+
                    '你将获得额外一次【邂逅】机会'+'\n'+
                    '<a href=\"http://www.wusiqing.com/webTest/TJW/TJW-weixin/app.html?'+msg.FromUserName+'\" >有趣的灵魂终将相遇</a>'
                    var now = new Date().getTime();
                    this.body = '<xml><ToUserName><![CDATA['+ msg.FromUserName+']]></ToUserName><FromUserName><![CDATA['+ msg.ToUserName+']]></FromUserName><CreateTime><![CDATA['+ now +']]></CreateTime><MsgType>text</MsgType><Content><![CDATA['+back+']]></Content>'+'</xml>'                    
                }
                    n='';
                    yield getFrom.insert_content(msg.FromUserName,n);   
                    yield getFrom.zore_play(msg.FromUserName);   

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
                         

                    this.status = 200;
                    this.type = 'application/xml';
                         // 发送图文信息；
                    // this.body = tuWen(msg.FromUserName,msg.ToUserName,msg.PicUrl);
                    var sex_j = yield getFrom.getSexFromDB(msg.FromUserName)
                    if(sex_j === 'B'){
                        var a_random = yield getFrom.random_img('C',msg.FromUserName)
                    }else if(sex_j === 'C'){
                        var a_random = yield getFrom.random_img('B',msg.FromUserName)
                    }else{
                        var a_random = yield getFrom.random_img(sex_j,msg.FromUserName)     
                    }
                    console.log('a_random:'+a_random)
                    var img_random = a_random.imgUrl;
                    console.log('img_random:'+img_random);
                    this.body = '<xml><ToUserName>'+msg.FromUserName+'</ToUserName><FromUserName>'+msg.ToUserName+'</FromUserName><CreateTime>'+now+'</CreateTime><MsgType>news</MsgType><ArticleCount>1</ArticleCount>'+'<Articles><item><Title>邂逅实验室(点击可看)</Title> <Description>你的照片已经成功提交到【邂逅实验室】啦，'+'\n'+
                    '这是我给你找的邂逅对象（只有这一个哦）先看看Ta精心挑选的照片，'+'\n'+
                    '然后决定是否与Ta进一步沟通，慎重考虑噢，或许这是你们唯一一次认识对方的机会。'+'\n'+
                    '继续聊 请回复 1，'+'\n'+
                   '没兴趣 请回复 2。'+'\n'+ '</Description><PicUrl>'+img_random+'</PicUrl><Url>'+img_random+'</Url></item</Articles></xml>';
                   yield getFrom.insert_needOpenId(a_random.openId,msg.FromUserName)
                    yield getFrom.insert_content(msg.FromUserName,n);       
                    yield getFrom.insert_img(msg.FromUserName,msg.PicUrl,msg.MediaId);
                                   
                     
                     

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
                    var needopenid = yield getFrom.getNeedOpenIdFromDB(msg.FromUserName);   

                    var back_msg = yield getFrom.random_voice(needopenid);
                    this.body = voicetype(msg.FromUserName,msg.ToUserName,now,back_msg);
                    
                    yield getFrom.insert_content(msg.FromUserName,n);                      
                     
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
                '分享到朋友圈并截图发送至后台'+'\n'+
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

                    //    return ;
             
           
           
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

