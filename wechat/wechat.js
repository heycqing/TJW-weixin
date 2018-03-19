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
// get请求access_token的连接；
var prefix = 'https://api.weixin.qq.com/cgi-bin/';
var api ={
    i:0,
    users:[],
    access_token: prefix + 'token?grant_type=client_credential',
	uploadTempMaterial:prefix+'media/upload?',  //access_token=ACCESS_TOKEN&type=TYPE  上传临时素材
    getAccessToken : function(){
        return util.readFileAsync(wechat_file);
    },
    add:function(){
        this.i+=1;
        return this.i;
    }

}

// 邂逅;
var temp_xiehou ='';
// 性别;
var temp_sex = '';
// 图片
var temp_image = '';
// 确认1，2
 var temp_sure = '';
//  确认1，1，2，2
var temp_sure_nd = '';
// 上传图片连接
var temp_imgUrl = '';
// 语音
var temp_voice = '';
// 留言1
var temp_msgs = '';
// 保存判断
var temp_get = '' ;


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
Save_voice[0]='zAfpXnIZWUIxA58YzF33aOpjfUQm1EKCAkSgBSDF70luDEZMU0J3237-hCdV1Aef';
Save_voice[1]='3vLk9ma2yPOQGQjdwrw5T_HF3lfpYjfzFjOW5cQHke7sjrVevQZyzXL36VDuacIB';
Save_voice[2]='p75h1seqK-9iQJyxZcPHhmhAj_gQk_IKJJcf3IepB8TNUVCMI94NHxE4TthRWgmw';
Save_voice[3]='b0-VbTfIrKjcYrCa7rIkWCFMRqnzP80SK4YmjHD8lrb-3zuyD5fhtTU-I6401irp';
Save_voice[4]='nl_efiBT_uoYsmoRf6xKWkG7YoJ5wssIX_QR95XMLrv8nlusspHiyYulenWl8MZV';

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

    api.add();
    console.log('i是：'+api.i);
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

               // 转化成json数据
               var content = yield util.parseXMLAsync(data);


               var msg =  util.formatMsg(content.xml);
               console.log('msg'+msg)


            //    判断多人；
            // var count = findit(string,user,msg.FromUserName);
            //    if( count != -1 ){
            //         string[i]  = string[count];
            //    }
                  // 测试测试
            if( msg.MsgType === 'text' ){

                var content = msg.Content;
                console.log('content是:'+content);
            
                if(content === '邂逅'){
                    var now = new Date().getTime();
                    // 全部初始化
                    temp_sex = '';
                     // 插入字符
                     string[api.i] = '';
                     string[api.i] += content;
                    console.log('string['+api.i+']是:'+string[api.i]+'\n'+'i是：'+api.i);
                 
                    this.status = 200;
                    this.type = 'application/xml';

                    var back = '欢迎来到【邂逅实验室】，希望你能在这里邂逅到有趣的灵魂。'+'\n'+
                                '首先请你做一个关乎终身大事的选择：'+'\n'+
                                '我是男生，想邂逅男生，请回复A；'+'\n'+
                                '我是男生，想邂逅女生，请回复B；'+'\n'+
                                '我是女生，想邂逅男生，请回复C；'+'\n'+
                                '我是女生，想邂逅女生，请回复D。';
                    

                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back)                        
                    
                    
                }else if(string[api.i].match('邂逅') != null && (content === 'A' || content === 'a')&& temp_sex ===''&& string[api.i].indexOf(1) === -1){
                 var sex = content.toUpperCase();
                 temp_sex = content;
                 //    添加sex;

                 string[api.i] +=sex;
                 console.log(string[api.i])



                    var now = new Date().getTime();
                    this.status = 200;
                    this.type = 'application/xml';
                    var back ='你是男生，想邂逅男生，确认请回复1，重新选择请回复2，5分钟不回复就当做你确认了哦!';                        
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back)                       

                }else if(string[api.i].match('邂逅') != null && (content === 'B' || content === 'b')&& temp_sex ===''&& string[api.i].indexOf(1) === -1){
                 var sex = content.toUpperCase();
                 temp_sex = content;
                 
                 //    添加sex;
                 string[api.i] +=sex;
                 console.log(string[api.i])
                    
                    var now = new Date().getTime();
                    this.status = 200;
                    this.type = 'application/xml';
                    var back ='你是男生，想邂逅女生，确认请回复1，重新选择请回复2，5分钟不回复就当做你确认了哦!';
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back)                        
                    
                    
                }else if(string[api.i].match('邂逅') != null && (content === 'C' || content === 'c')&& temp_sex ==='' && string[api.i].indexOf(1) === -1){
                     var sex = content.toUpperCase();
                 temp_sex = content;
                     
                    //    添加sex;
                    string[api.i] +=sex;
                    console.log(string[api.i])
                    
                    var now = new Date().getTime();
                    this.status = 200;
                    this.type = 'application/xml';
                    var back ='你是女生，想邂逅男生，确认请回复1，重新选择请回复2，5分钟不回复就当做你确认了哦!';                        
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back)                        
                    
                    
                }else if(string[api.i].match('邂逅') != null && (content === 'D' || content === 'd') && temp_sex ==''&& string[api.i].indexOf(1) === -1){
                     var sex = content.toUpperCase();
                 temp_sex = content;
                     
                     //    添加sex;
                     string[api.i] +=sex;
                    console.log(string[api.i])
                    
                    var now = new Date().getTime();
                    this.status = 200;
                    this.type = 'application/xml';
                    var back ='你是女生，想邂逅女生，确认请回复1，重新选择请回复2，5分钟不回复就当做你确认了哦!';                        
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back)                        
                    
                    
                }
                // 确认
                else if((string[api.i].indexOf('邂逅A') === 0 || string[api.i].indexOf('邂逅B') === 0 ||string[api.i].indexOf('邂逅C') === 0 || string[api.i].indexOf('邂逅D') === 0) && string[api.i].indexOf('image') === -1 &&content ==='1'){
                    var now = new Date().getTime(); 
                 //    temp_sure =content;  
                     string[api.i] += content;
                     while(string[api.i].length >4 ){
                         string[api.i] =string[api.i].substring(0,string[api.i].length-1)
                     }
                     console.log(string[api.i])

                    this.status = 200;
                    this.type = 'application/xml';
                    var back = '恭喜你成功加入今天的【邂逅实验室】！'+'\n'+
                    '我将在实验室里努力挑选一位有缘人与你邂逅，'+'\n'+
                    '接下来请你挑选一张你认为满意的本人照片发给我们，'+'\n'+
                    '我们将用这张照片作为媒介，让你们进行一轮初步交流，'+'\n'+
                    '所以一定要翻遍相册找张你非常满意的照片噢！'+'\n'+
                    '温馨提示：只有一次上传照片的机会，一旦传错将无法修改。'


                    

                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back)   
                }
                // 重新选择；
                else if((string[api.i].indexOf('邂逅A') === 0 || string[api.i].indexOf('邂逅B') === 0 ||string[api.i].indexOf('邂逅C') === 0 || string[api.i].indexOf('邂逅D') === 0)&&content === '2' && string[api.i].indexOf('image') === -1 &&string[api.i].length ===3){
                    temp_sex = '';
                    string[api.i] = '邂逅'

                    var now = new Date().getTime();                        
                    this.status = 200;
                    this.type = 'application/xml';
                    var back = '请重新选择：'+'\n'+
                    '我是男生，想邂逅男生，请回复A；'+'\n'+
                    '我是男生，想邂逅女生，请回复B；'+'\n'+
                    '我是女生，想邂逅男生，请回复C；'+'\n'+
                    '我是女生，想邂逅女生，请回复D。';

                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back)         

                }
                 //    上传完图片后，确认1
                else if((string[api.i].indexOf('邂逅A1image') === 0 || string[api.i].indexOf('邂逅B1image') === 0 ||string[api.i].indexOf('邂逅C1image') === 0 || string[api.i].indexOf('邂逅D1image') === 0)&& content ==='1'&& string[api.i].indexOf('2') === -1){

                     // var temp_sure_nd = content;
                     string[api.i] += content;
                     while(string[api.i].length >10 ){
                         string[api.i] =string[api.i].substring(0,string[api.i].length-1)
                     }

                     var now = new Date().getTime();                        
                     this.status = 200;
                     this.type = 'application/xml';
                    var back = '恭喜你们成为邂逅实验室第XX对有缘人，对方也希望跟你认识，'+'\n'+
                    '接下来请你们各自按照以下格式回复做一个自我介绍吧，当然对方也会向你介绍自己。'+'\n'+
                    '1.该怎么称呼你？'+'\n'+
                    '2.你是北师、北理、UIC的学生或是其他身份？'+'\n'+
                    '3.一般怎么安排自己的周末？'+'\n'+
                    '4.最喜欢的一首歌？'+'\n'+
                    '5.最向往的城市？'
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back)   
                    
              
                }
                 //上传完图片，重新选择2
                 else if((string[api.i].indexOf('邂逅A1image') === 0 || string[api.i].indexOf('邂逅B1image') === 0 ||string[api.i].indexOf('邂逅C1image') === 0 || string[api.i].indexOf('邂逅D1image') === 0)&& content ==='2' && string[api.i].indexOf('text') === -1 &&string[api.i].length === 9){

                     string[api.i] += content;
                     while(string[api.i].length >10 ){
                         string[api.i] =string[api.i].substring(0,string[api.i].length-1)
                     }
                     console.log('string\n\n'+string[api.i])
                     var now = new Date().getTime();                        
                     this.status = 200;
                     this.type = 'application/xml';
                     var back ='真的不愿意继续聊聊吗？这是今天唯一一个介绍给你的对象'+'\n'+
                     '错过就没有了，你们也很难再联系上了。'+'\n'+
                     '不愿邂逅请回复：1'+'\n'+
                     '重新考虑请回复：2'+'\n';

                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back)   
                     
                 } 
                 //  重新选择2，1的分支
                 else if((string[api.i].indexOf('邂逅A1image2') === 0 || string[api.i].indexOf('邂逅B1image2') === 0 ||string[api.i].indexOf('邂逅C1image2') === 0 || string[api.i].indexOf('邂逅D1image2') === 0) && string[api.i].indexOf('text') === -1 && content === '1' && string[api.i].length === 10){

                     
                    var back ='好吧，真的很遗憾呢，那我们今天就先到这了，欢迎明天再来！'
                    string[api.i] = '';
                    var now = new Date().getTime();                        
                    this.status = 200;
                    this.type = 'application/xml';
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back); 
                     

                 }   
                 //  重新选择2，2的分支
                 else if((string[api.i].indexOf('邂逅A1image2') === 0 || string[api.i].indexOf('邂逅B1image2') === 0 ||string[api.i].indexOf('邂逅C1image2') === 0 || string[api.i].indexOf('邂逅D1image2') === 0) && string[api.i].indexOf('text') === -1 && string[api.i].indexOf('image1') === -1 && content === '2' && string[api.i].length === 10){

                    string[api.i] += content;
                     while(string[api.i].length >11 ){
                         string[api.i] =string[api.i].substring(0,string[api.i].length-1)
                     }
                     console.log("\nstring\n"+string[api.i])
                     var back ='请重新选择'+'\n'+
                     '继续聊 请回复“1”，'+'\n'+
                     '没兴趣 请回复“2”。'+'\n';
                     var now = new Date().getTime();                        
                     this.status = 200;
                     this.type = 'application/xml';
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back); 
                     
                 }
                 // 重新选择2，2，1的分支；
                 else if( (string[api.i].indexOf('邂逅A1image22') === 0 || string[api.i].indexOf('邂逅B1image22') === 0 || string[api.i].indexOf('邂逅C1image22') === 0 || string[api.i].indexOf('邂逅D1image22') === 0)  && content === '1' && string[api.i].indexOf('text') === -1){
                     
                     
                     string[api.i] = '邂逅A1image1';

                     var now = new Date().getTime();                        
                     this.status = 200;
                     this.type = 'application/xml';
                    var back = '恭喜你们成为邂逅实验室第XX对有缘人，对方也希望跟你认识，'+'\n'+
                    '接下来请你们各自按照以下格式回复做一个自我介绍吧，当然对方也会向你介绍自己。'+'\n'+
                    '1.该怎么称呼你？'+'\n'+
                    '2.你是北师、北理、UIC的学生或是其他身份？'+'\n'+
                    '3.一般怎么安排自己的周末？'+'\n'+
                    '4.最喜欢的一首歌？'+'\n'+
                    '5.最向往的城市？'
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back)  

                 }
                 // 重新选择2，2，2的分支；
                 else if((string[api.i].indexOf('邂逅A1image22') === 0 || string[api.i].indexOf('邂逅B1image22') === 0 || string[api.i].indexOf('邂逅C1image22') === 0 || string[api.i].indexOf('邂逅D1image22') === 0)  && content === '2' && string[api.i].indexOf('text') === -1){
                     string[api.i] = '邂逅A1image2';
                     var now = new Date().getTime();                        
                     this.status = 200;
                     this.type = 'application/xml';
                     var back ='真的不愿意继续聊聊吗？这是今天唯一一个介绍给你的对象'+'\n'+
                     '错过就没有了，你们也很难再联系上了。'+'\n'+
                     '不愿邂逅请回复：1'+'\n'+
                     '重新考虑请回复：2'+'\n';

                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back)  

                 }
                 
                 
                 // 存储留言1；
                else if((string[api.i].indexOf('邂逅A1image1') === 0 || string[api.i].indexOf('邂逅B1image1') === 0 ||string[api.i].indexOf('邂逅C1image1') === 0 || string[api.i].indexOf('邂逅D1image1') === 0) && string[api.i].indexOf('voice') === -1 && content != ''){
                     // 存储留言   
                     // temp_msgs = content;
                     string[api.i] += msg.MsgType;
                     while(string[api.i].length >14 ){
                         string[api.i] = string[api.i].substring(0,string[api.i].length-1)
                     }

                     var SaveCon = content;
                     console.log(Save_msgs);
                     // var modSql = 'UPDATE TJWdata SET msgs = ? WHERE imgUrl = ?';
                     // var modSqlParams = [SaveCon, temp_imgUrl];
                     // //改
                     // connection.query(modSql,modSqlParams,function (err, result) {
                     // if(err){
                     //         console.log('[UPDATE ERROR] - ',err.message);
                     //         return;
                     // }        
                     // console.log('--------------------------UPDATE----------------------------');
                     // console.log('UPDATE affectedRows',result.affectedRows);
                     // console.log('-----------------------------------------------------------------\n\n');
                     // });
                 // 结束
                 // 发送其他留言,必须要匹配到同一张图片的人；
                     var a = Math.floor(Math.random()*Save_msgs.length);
                     
                       
                     var back_msg = Save_msgs[a];
                 
                         
                     

                     this.status = 200;
                     this.type = 'application/xml';
                     var back ='\n\n'+'【'+'\n'+back_msg+'\n'+'】'+'\n\n\n'+'这是对方的回复，你们先得有个大致了解才能聊下去吧，祝你们聊的愉快！'+'\n\n'+'接下来请你发送一条展示自己的语音来吸引Ta，'+'\n'+
                     '如果不知道说什么，可以跟Ta聊聊“你认为怎样的邂逅才算是美丽？”，'+'\n\n'+
                     '或者唱一首应景的歌。'+'\n'+
                     '请注意：1、语音长度需超过6秒，否则将影响系统传输；'+'\n\n'+
                                   '2、语音上传成功后才会收到下一步提示，请稍等；'+'\n\n'+
                                   '3、你只有一次上传语音的机会，一旦传错将无法修改。'+'\n\n\n\n'+'【接受到声音后，直接输入你想留下的文字就行了！】';
                     Save_msgs.push(SaveCon);
                                   
                     this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back) ;

                }else if( (string[api.i].indexOf('邂逅A1image1text') === 0 || string[api.i].indexOf('邂逅B1image1text') === 0 ||string[api.i].indexOf('邂逅C1image1text') === 0 || string[api.i].indexOf('邂逅D1image1text') === 0) && string[api.i].indexOf('voice') === 14  &&  content != ''){
                     var a = Math.floor(Math.random()*Save_msgs.length);
                   
                         var back_msg = Save_msg_nd[a];
                     
                     this.status = 200;
                     this.type = 'application/xml';
                     var back ='你的留言我们已经转达了，'+'\n'+
                     '如果还没有收到对方的留言，'+'\n'+
                     '那可能是堵在路上了，请稍等。'+'\n\n\n'+'【'+back_msg+'】'+'\n\n\n';
                     Save_msg_nd.push(content);
                     
                     temp = string[api.i]
                     // 所有设定重置
                     string[api.i] = '';
                     
                     this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back);

                }
                // 留下联系方式
                else if(temp.match('邂逅A1image1textvoicetext') !== null || temp.match('邂逅B1image1textvoicetext') !== null || temp.match('邂逅C1image1textvoicetext') !== null || temp.match('邂逅D1image1textvoicetext') !== null){
                    var back =  '好了，今天【邂逅实验室】的线上之旅就到此结束了。'+'\n'+
                                '哦，对了，为了纪念这场实验，也为了更加完整的体现这场邂逅，'+'\n'+
                                '我们准备了名额有限的一部分线下邂逅机会，'+'\n'+
                                '在我们精心挑选的时间和场地（此处待定）。 '+'\n'+
                                '如果你希望以这样的方式圆满完成这次邂逅，'+'\n'+
                                '请留下  【 姓名+手机号码 】   以便我们联系你，'+'\n'+
                                '双方均填入准确信息即为成功报名，任何一方放弃填写均不生效。';
                    this.status = 200;
                    this.type = 'application/xml';
                    var now = new Date().getTime();
                    s
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back);
                    
                }
            
                else{

                    var now = new Date().getTime();
                    this.status = 200;
                    this.type = 'application/xml';
                    var back = '请重新开始 【 邂逅 】';
                    string[api.i] = '';
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back);
                    console.log("that.body:"+this.body);

                }

                    
            }
                 //    图片
            else if(msg.MsgType === 'image' && (string[api.i].indexOf('邂逅A1') === 0 || string[api.i].indexOf('邂逅B1') === 0 ||string[api.i].indexOf('邂逅C1') === 0 || string[api.i].indexOf('邂逅D1') === 0) ){
                     var now = new Date().getTime()
                     
                     //    temp_image = msg.MsgType;
                     //    temp_imgUrl = msg.PicUrl;
                     //    temp_sure ='';                       
                         
                         string[api.i] += msg.MsgType;
                         console.log('图片：'+string[api.i])
                         while(string[api.i].length >9 ){
                             string[api.i] =string[api.i].substring(0,string[api.i].length-1)
                         }
                         

                     this.status = 200;
                     this.type = 'application/xml';
                     var that =this;
                         // 连接数据库
                     var connection = mysql.createConnection({     
                         host: '39.108.58.83',
                         user: 'root',
                         password: '1234',
                         port: '3306',
                         database: 'TJW',
                         }); 
                     
                         connection.connect();
                         var  addSql = 'INSERT INTO TJWdata(sex,imgUrl,imgId,voiceId) VALUES(?,?,?,?)';
                         var  addSqlParams = [temp_sex,msg.PicUrl,msg.MediaId,''];
                         //增
                         connection.query(addSql,addSqlParams,function (err, result) {
                                 if(err){
                                 console.log('[INSERT ERROR] - ',err.message);
                                 return;
                                 }        
                         
                             console.log('--------------------------INSERT----------------------------');
                             //console.log('INSERT ID:',result.insertId);        
                             console.log('INSERT ID:',result);        
                             console.log('-----------------------------------------------------------------\n\n');  
                         });
                     connection.end();
                         // 结束

                         // 发送图文信息；
                     this.body = tuWen(msg.FromUserName,msg.ToUserName,msg.PicUrl);
                     
                     

             }
         
                 else if(msg.MsgType === 'voice' && (string[api.i].indexOf('邂逅A1image1text') === 0 || string[api.i].indexOf('邂逅B1image1text') === 0 ||string[api.i].indexOf('邂逅C1image1text') === 0 || string[api.i].indexOf('邂逅D1image1text') === 0)){

                     var now = new Date().getTime()
                     this.status = 200;
                     this.type = 'application/xml';

                     string[api.i] += msg.MsgType;
                     while(string[api.i].length >19 ){
                         string[api.i] =string[api.i].substring(0,string[api.i].length-1)
                     }
                     console.log('语音:'+string)
                     
                     temp_voice = msg.MediaId;

                     var voiceID = msg.MediaId;
                         Save_voice.push(voiceID);
                     // 更新数据
                         // 新增时间和数据库语句
                         var connection = mysql.createConnection({     
                         host: '39.108.58.83',
                         user: 'root',
                         password: '1234',
                         port: '3306',
                         database: 'TJW',
                     }); 
                         
                         connection.connect();

                         var modSql = 'UPDATE TJWdata SET voiceId = ? WHERE imgUrl = ?';
                         var modSqlParams = [voiceID, temp_imgUrl];
                         //改
                         connection.query(modSql,modSqlParams,function (err, result) {
                         if(err){
                                 console.log('[UPDATE ERROR] - ',err.message);
                                 return;
                         }        
                         console.log('--------------------------UPDATE----------------------------');
                         console.log('UPDATE affectedRows',result.affectedRows);
                         console.log('-----------------------------------------------------------------\n\n');
                         });

                             // 发送语言，需要匹配到相关图片；
                             // 发送语音没调试？？
                                     var a = Math.floor(Math.random()*Save_voice.length);
                                                 
                                                 
                                     var back_msg = Save_voice[a];

                                 var back ='听到Ta对你说的话了吗？'+'\n'+
                             '相信聊到这里你们都已经有了简单的了解，'+'\n'+
                             '赘述太多，或许反而会让这件事变得不那么浪漫，'+'\n'+
                             '最后一次机会，抓紧时间给Ta留下一段想说的文字吧！'+'\n'+
                             '你们当然也可以给对方留下自己的联系方式，如果还想进一步沟通的话。'+'\n'+
                             '温馨提示：留言一旦发出将无法修改。'
                         

                             //    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back);
                             this.body = voicetype(msg.FromUserName,msg.ToUserName,now,back_msg)
                             //    temp_voice ='';

                 }else{
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


// 回复图片；
function *imgType_body(){
    // console.log(this.body)
    var now = new Date().getTime();
    
    this.status = 200;
    this.type = 'application/xml';
    var a ='o5UHAw4wsVakuATXga0y4JnLZ3Gc';
    var b = 'gh_2b1961cfa81a';
    // var c = new Date().getTime();
    var d ='Pkq5wlSpbw0Db_JUeSioVFMycCKdy5gfCBlCc43AjfrqaRNpx-d5A0-Ub89t97z1'
    var reply = '<xml><ToUserName>'+a+'</ToUserName><FromUserName>'+b
    +'</FromUserName><CreateTime>'+now+'</CreateTime><MsgType>image</MsgType><Image><MediaId>'+d
    +'</MediaId></Image></xml>'
    // console.log(reply);
   
    
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
                            // var back_msg = Save_imgUrl[ac];
                        
                        
    // var d ='http://mmbiz.qpic.cn/mmbiz_jpg/d1C27ickcbib2mK9VKxBBmtGJkauspaEiaDC9uRrciaBW3ZGdS2T0o6W3GLHQVibk69Fbh5apzMvDAsI5Nwiar5LxntQ/0';
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

//  遍历对象数组，查找
function findit(arr,attr,val){
    for (var i=0;i<arr.length;i++){
        if(arr[i][attr] == val){
            return i;
        }
    }
    return -1;
}



