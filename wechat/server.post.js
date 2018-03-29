var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var mysql = require('mysql')
 
var app = express();
 
    // bodyParser.urlencoded解析form表单提交的数据
    app.use(bodyParser.urlencoded({extended: false}));
    
    // bodyParser.json解析json数据格式的
    app.use(bodyParser.json());
    
    app.post('/saveJSON',function(req, res){
 
    // 对象转换为字符串
    var str_json = JSON.stringify(req.body.openId); 
    // var a=  JSON.parse(JSON.stringify(req.body,2))
    
    console.log('str:'+str_json)
    var connection = mysql.createConnection({     
        host     : '39.108.58.83',       
        user     : 'root',              
        password : '1234',       
        port: '3306',                   
        database: 'TJW', 
    }); 

    connection.connect();
    var modSql = 'UPDATE dataOfTJW SET play = 1 WHERE openId = '+str_json;
    // var modSqlParams = [str_json];
    // console.log(modSqlParams)
    console.log(modSql+str_json)
    //改
    connection.query(modSql,function (err, result) {
    if(err){
            console.log('[UPDATE ERROR] - ',err.message);
            return;
    }        
    console.log('--------------------------UPDATE----------------------------');
    console.log('UPDATE affectedRows',result.affectedRows);
    console.log('-----------------------------------------------------------------\n\n');
    });

    connection.end();
 
    fs.writeFile('graph.json',str_json, 'utf8', function(){
    // 保存完成后的回调函数
  
    console.log("保存完成");
    });
 
});
 
app.listen(3000);