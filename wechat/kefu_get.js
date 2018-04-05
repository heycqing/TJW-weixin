var fs = require('fs');
// var Promise = require('bluebird');
// var request = Promise.promisify(require('request'));
var path = require('path')

var wechat_file = path.join(__dirname,'../config/wechat_file.txt') 

exports.toJson = function(wechat_file){
    return new Promise(function(resolve,reject){
        fs.readFile(wechat_file, "utf-8", function(error, data) {
            if (error) {
                console.log(error);
                console.log("config文件读入出错");
            }else{
                console.log(data.toString());
                var temp= data.toString();
                var data_ =JSON.parse(temp)
                console.log('原来的函数 access_token：'+data_.access_token)
                // temp_access = data.access_token;
                resolve(data_.access_token);

            }
       
    
    });
    })
   
}