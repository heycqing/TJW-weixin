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
    access_token: prefix + 'token?grant_type=client_credential',
	uploadTempMaterial:prefix+'media/upload?',  //access_token=ACCESS_TOKEN&type=TYPE  上传临时素材
    getAccessToken : function(){
        return util.readFileAsync(wechat_file);
    }

}


var temp_xiehou ='';
// 确认学校，并保存值；
var temp_school = '';
// 确认性别，并保存值；
var temp_sex = '';
var temp_sure_school ='';
var temp_sure_sex ='';
// 判断是否输入图片;
var temp_image = '';

// 判断
var temp_picUrl = '';
var getID_pic = '';



// 性别时间
var total = '';


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

                

                // 测试测试
                if(msg.MsgType === 'text' ){
                    var content = msg.Content;
                    console.log('content是:'+content);
                    console.log('是文本');
                
                    if(content === '邂逅'){
                        var now = new Date().getTime();
                        
                        this.status = 200;
                        this.type = 'application/xml';
                        temp_xiehou = content;
                        var back ='欢迎来到【邂逅实验室】，希望你能在这里邂逅到有趣的灵魂。'+'\n'+
                        '为了更好地迎接即将到来的这场邂逅，'+'\n'+
                        '请你认真地回答几个问题：'+'\n'+
                        '我来自北师，我希望邂逅北师的朋友，请回复A；'+'\n'+
                        '我来自北师，我希望邂逅北理的朋友，请回复B；'+'\n'+
                        '我来自北理，我希望邂逅北理的朋友，请回复C；'+'\n'+
                        '我来自北理，我希望邂逅北师的朋友，请回复D。'+'\n'+
                        '活动中遇到任何问题，请添加客服微信号:TJWstation';

                        this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back)                        
                        
                        
                    }else if(temp_xiehou === '邂逅' && content === 'A'){
                        var now = new Date().getTime();
                        total = new Date().getTime();
                        
                        this.status = 200;
                        this.type = 'application/xml';
                        // temp_xiehou = content;
                        temp_school = content;
                        
                        var back ='你来自北师，你想邂逅北师的朋友，确认请回复1，重新选择请回复2，5分钟不回复就当做你确认了哦。';
                        this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back)                        
                        
                 
                        
                    }else if(temp_xiehou === '邂逅' && content === 'B'){
                        var now = new Date().getTime();
                        total = new Date().getTime();
                        
                        this.status = 200;
                        this.type = 'application/xml';
                        temp_school = content;

                        var back ='你来自北师，你想邂逅北理的朋友，确认请回复1，重新选择请回复2，5分钟不回复就当做你确认了哦。';
                        this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back)                        
                        
                        
                    }else if(temp_xiehou === '邂逅' && content === 'C'){
                        var now = new Date().getTime();
                        total = new Date().getTime();
                        
                        this.status = 200;
                        this.type = 'application/xml';
                        temp_school = content;

                        var back ='你来自北理，你想邂逅北理的朋友，确认请回复1，重新选择请回复2，5分钟不回复就当做你确认了哦。';
                        this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back)                        
                        
                        
                    }else if(temp_xiehou === '邂逅' && content === 'D'){
                        var now = new Date().getTime();
                        total = new Date().getTime();
                        
                        this.status = 200;
                        this.type = 'application/xml';
                        temp_school = content;

                        var back ='你来自北理，你想邂逅北师的朋友，确认请回复1，重新选择请回复2，5分钟不回复就当做你确认了哦。';
                        this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back)                        
                        
                        
                    }
                    // 重新选择；
                    else if(temp_xiehou === '邂逅' && content === '2'){
                        var now = new Date().getTime();
                        total = '';
                        
                        this.status = 200;
                        this.type = 'application/xml';
                        temp_xiehou = content;
                        var back ='请重新选择'+'\n'+
                        '我来自北师，我希望邂逅北师的朋友，请回复A；'+'\n'+
                        '我来自北师，我希望邂逅北理的朋友，请回复B；'+'\n'+
                        '我来自北理，我希望邂逅北理的朋友，请回复C；'+'\n'+
                        '我来自北理，我希望邂逅北师的朋友，请回复D。'+'\n'+
                        '活动中遇到任何问题，请添加客服微信号:TJWstation';

                        this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back)         

                    }
                    // 确认环节；
                    else if((temp_xiehou ==='邂逅'  && content === '1') && (temp_school === 'A' || temp_school === 'B' || temp_school === 'C' || temp_school === 'D') ){
                        var now = new Date().getTime();
                        this.status = 200;
                        this.type = 'application/xml';
                        temp_sure = content;
                        
                        var back = '好的，你的要求我收到了，接下来请你再做一个选择：'+'\n'+
                                    '我是男生，想邂逅男生，请回复E；'+'\n'+
                                    '我是男生，想邂逅女生，请回复F；'+'\n'+
                                    '我是女生，想邂逅男生，请回复H；'+'\n'+
                                    '我是女生，想邂逅女生，请回复I。';

                        this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back)                        
                    
                    }else if(temp_xiehou ==='邂逅'  && temp_sure === '1' && (temp_school === 'A' || temp_school === 'B' || temp_school === 'C' || temp_school === 'D') && content ==='E'){
                        var now = new Date().getTime();
                        this.status = 200;
                        this.type = 'application/xml';
                        temp_sex = content;
                        temp_sure = '';
                        console.log('temp_sex是：'+temp_sex);
                        var back ='你是男生，想邂逅男生，确认请回复yes，重新选择请回复no，5分钟不回复就当做你确认了哦!';
                        this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back)                        
                        
                    }else if(temp_xiehou ==='邂逅'  && temp_sure === '1' && (temp_school === 'A' || temp_school === 'B' || temp_school === 'C' || temp_school === 'D') && content ==='F'){
                        var now = new Date().getTime();
                        this.status = 200;
                        this.type = 'application/xml';
                        temp_sex = content;
                        temp_sure = '';
                        
                        var back ='你是男生，想邂逅女生，确认请回复yes，重新选择请回复no，5分钟不回复就当做你确认了哦!';
                        this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back) ;

                    }else if(temp_xiehou ==='邂逅'  && temp_sure === '1' && (temp_school === 'A' || temp_school === 'B' || temp_school === 'C' || temp_school === 'D') && content ==='H'){
                        var now = new Date().getTime();
                        this.status = 200;
                        this.type = 'application/xml';
                        temp_sex = content;
                        temp_sure = '';
                        
                        var back ='你是女生，想邂逅男生，确认请回复yes，重新选择请回复no，5分钟不回复就当做你确认了哦!';
                        this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back) ;
                    }else if(temp_xiehou ==='邂逅'  && temp_sure === '1' && (temp_school === 'A' || temp_school === 'B' || temp_school === 'C' || temp_school === 'D') && content ==='I'){
                        var now = new Date().getTime();
                        this.status = 200;
                        this.type = 'application/xml';
                        temp_sex = content;
                        temp_sure = '';
                        
                        var back ='你是女生，想邂逅女生，确认请回复yes，重新选择请回复no，5分钟不回复就当做你确认了哦!';
                        this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back) ;
                    }else if( temp_xiehou ==='邂逅'   && content==='yes' && (temp_school === 'A' || temp_school === 'B' || temp_school === 'C' || temp_school === 'D') && (temp_sex ==='E' || temp_sex ==='F' || temp_sex ==='H' || temp_sex ==='I')){

                        var now = new Date().getTime();
                        this.status = 200;
                        this.type = 'application/xml';

                        temp_sure_sex = content;

                        var back ='恭喜你成功加入今天的【邂逅实验室】！'+'\n'+
                        '我将在实验室里努力挑选一位有缘人与你邂逅，'+'\n'+
                        '接下来请你挑选一张你认为满意的本人照片发给我们，'+'\n'+
                        '我们将用这张照片作为媒介，让你们进行一轮初步交流，'+'\n'+
                        '所以一定要翻遍相册找张你非常满意的照片噢！';

                    
                       
                        

                        this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back) ;
                    }


                    // 重新选择
                    else if(temp_xiehou ==='邂逅'   && content==='no' && (temp_school === 'A' || temp_school === 'B' || temp_school === 'C' || temp_school === 'D') && (temp_sex ==='E' || temp_sex ==='F' || temp_sex ==='H' || temp_sex ==='I')){
                        var now = new Date().getTime();
                        this.status = 200;
                        this.type = 'application/xml';
                        temp_sure = content;
                        
                        var back = '请重新选择：'+'\n'+
                                    '我是男生，想邂逅男生，请回复E；'+'\n'+
                                    '我是男生，想邂逅女生，请回复F；'+'\n'+
                                    '我是女生，想邂逅男生，请回复H；'+'\n'+
                                    '我是女生，想邂逅女生，请回复I。';

                        this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back)                        
                    
                            
                    }
                    else if(content === 'img'){
                        var now = new Date().getTime()
                        
                        this.status = 200;
                        this.type = 'application/xml';
                        var back ="kAPh7QLnzaZEieTwuvwjzwkZJgA6CSe8IT5d5iEPybilZhdF9-7ZvFJZF31ChsXi";
                        console.log("this.type是:"+this.type)
                        this.body = imgType(msg.FromUserName,msg.ToUserName,now,back) 


                    }
                    // TEST
                    else if(content === 'gg'){
                        var now = new Date().getTime();
                        console.log("now是:"+now)
                        this.status = 200;
                        this.type = 'application/xml';

                     
                        var that = this;

                        select(sql,processdata);
                        
                        // 测试测试

                        function select(sql,callback){

                            var  sql = "SELECT picId FROM getTheTJW where school= 'A' and sex = 'E' ";
                            
                            var connection = mysql.createConnection({     
                                host: '39.108.58.83',
                                user: 'root',
                                password: '1234',
                                port: '3306',
                                database: 'TJW',
                            }); 

                        
                            connection.connect();

                            connection.query(sql,function(err,data){
                                if(err){console.log(err)}
                                // 作为参数传递出去
                                callback(data[0].picId)
                            })
                            // return a;
                        };


                        function processdata(data){

                            console.log("\n\n\nthis是"+that);
                                             
                          
                         
                            console.log("\n\n\ndata是:"+data);
                            console.log("msg.FromUserName是："+msg.FromUserName)
                            console.log("msg.ToUserName是："+msg.ToUserName)
                            console.log("this.type是:"+this.type)
                            console.log("now是："+now+"\n\n\n")

                            that.body = imgType(msg.FromUserName,msg.ToUserName,now,data);   

                            return  console.log("this.body是："+that.body);

                        }

                        



                    }
                    else{

                        var now = new Date().getTime();
                        this.status = 200;
                        this.type = 'application/xml';
                        var back = '听不懂你在说的是什么？';
                        this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back);
                        console.log("that.body:"+this.body);

                        console.log("this是："+this);
                    }

                        
                }else if(msg.MsgType === 'image' && temp_xiehou !='' && temp_school !='' && temp_sex != ''){
                    var now = new Date().getTime()
                    
                    temp_image = msg.MsgType;
                    this.status = 200;
                    this.type = 'application/xml';
                    var that =this;
                    // var back ="kAPh7QLnzaZEieTwuvwjzwkZJgA6CSe8IT5d5iEPybilZhdF9-7ZvFJZF31ChsXi";
                    //     console.log("this.type是:"+this.type)
                    // this.body = imgType(msg.FromUserName,msg.ToUserName,now,back);
                    
                    
                    
                 
                    
                    // // 新增时间和数据库语句
                    var connection = mysql.createConnection({     
                            host: '39.108.58.83',
                            user: 'root',
                            password: '1234',
                            port: '3306',
                            database: 'TJW',
                        }); 
                         
                    connection.connect();

                    var picUrl = msg.PicUrl;
                    var temp_picUrl = msg.PicUrl;

                    var picId = msg.MediaId;

                    var time = date2str(new Date(), "yyyy-MM-d h:m:s:ms");
 
                    addSqlParams = [temp_school,temp_sex,time,picUrl,picId,''];
                    var  addSql = 'INSERT INTO getTheTJW(school,sex,time,picUrl,picId,voiceId) VALUES(?,?,?,?,?,?)';

                    // 打印信息
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
                    // connection.end();
                    


           
                    // var back ='你的照片已经成功提交到【邂逅实验室】啦，'+'正在为你寻找邂逅对象'+'这可能需要点时间，你可以晚点再来';

                    if(temp_school === 'A' && temp_sex === 'E'){
                        var  sql = "SELECT picId FROM getTheTJW where school= 'A' and sex = 'E'  ";
                    }
                    else if(temp_school === 'A' && temp_sex === 'I'){
                        var  sql = "SELECT picId FROM getTheTJW where school= 'A' and sex = 'I'  ";
                    }else if(temp_school === 'C' && temp_sex === 'E'){
                        var  sql = "SELECT picId FROM getTheTJW where school= 'C' and sex = 'E'  ";
                    }else if(temp_school === 'C' && temp_sex === 'I'){
                        var  sql = "SELECT picId FROM getTheTJW where school= 'C' and sex = 'I'  ";
                    }else if(temp_school === 'B' && temp_sex === 'E'){
                        var  sql = "SELECT picId FROM getTheTJW where school= 'B' and sex = 'E'  ";
                    }else if(temp_school === 'B' && temp_sex === 'I'){
                        var  sql = "SELECT picId FROM getTheTJW where school= 'B' and sex = 'I'  ";
                    }else if(temp_school === 'D' && temp_sex === 'E'){
                        var  sql = "SELECT picId FROM getTheTJW where school= 'D' and sex = 'E'  ";
                    }else if(temp_school === 'D' && temp_sex === 'I'){
                        var  sql = "SELECT picId FROM getTheTJW where school= 'D' and sex = 'I'  ";
                    }else if(temp_school === 'A' && (temp_sex === 'F' || temp_sex === 'H')){
                        var  sql = "SELECT picId FROM getTheTJW where school= 'D' and sex = 'F'  or sex = 'H' ";
                    }else if(temp_school === 'B' && (temp_sex === 'F' || temp_sex === 'H')){
                        var  sql = "SELECT picId FROM getTheTJW where school= 'D' and sex = 'F'  or sex = 'H' ";
                    }else if(temp_school === 'C' && (temp_sex === 'F' || temp_sex === 'H')){
                        var  sql = "SELECT picId FROM getTheTJW where school= 'D' and sex = 'F'  or sex = 'H' ";
                    }else if(temp_school === 'D' && (temp_sex === 'F' || temp_sex === 'H')){
                        var  sql = "SELECT picId FROM getTheTJW where school= 'D' and sex = 'F'  or sex = 'H' ";
                    }

                    //查
                    var select=function(sql,callback){
                        connection.query(sql,function(err,data){
                            if(err){console.log(err)}


                            var a = Math.floor(Math.random()*data.length);
                            console.log(a);
                            
                            if(data[a].picId === temp_picUrl){
                                a =  a - 1;
                                console.log("\n\n\ntemp_picUrl是:"+temp_picUrl+"\n\n\n")
                                console.log(data[a].picId);
                                callback(data[a].picId,that)
                            // return result[a].picId
                        
                            }else{
                                console.log(data[a].picId);
                                callback(data[a].picId,that)
                                // return result[a].picId                               
                            }


                        })
                    };
                    
                    function processdata(data){
                        console.log("data是:"+data);
                        that.body = imgType(msg.FromUserName,msg.ToUserName,now,data);
                    }

                    select(sql,processdata);
                   
                   return;


                        
                  


                    



                
                       
                    
                    
                    
           


                  

                    
                    

                        

                }
                else if(msg.MsgType === 'voice' && temp_xiehou !='' && temp_school !='' && temp_sex != '' && temp_image != ''){

                    var now = new Date().getTime()
                    this.status = 200;
                    this.type = 'application/xml';

                    var voiceID = msg.MediaId;

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

                var modSql = 'UPDATE getTheTJW SET voiceId = ? WHERE picUrl = ?';
                var modSqlParams = [voiceID, temp_picUrl];
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


                var back ='你的语音已经成功提交到【邂逅实验室】啦!'

                this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back);

                }else{
                    var now = new Date().getTime();
                    this.status = 200;
                    this.type = 'application/xml';
                    var back = '听不懂你在说的是什么？';
                    this.body = xmlToreply(msg.FromUserName,msg.ToUserName,now,back)
                    console.log("that.body:"+this.body)
                }
            
                return ;
              
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
function xmlToreply(a,b,c,d){
    var reply ='<xml><ToUserName>'+ a+'</ToUserName><FromUserName>'+ b+'</FromUserName><CreateTime>'+ c +'</CreateTime><MsgType>text</MsgType><Content>'+d+'</Content>'+'</xml>';
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




