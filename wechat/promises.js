var mysql = require('mysql')
exports.getOpenIdFromDB = function(needToFind){
    return new Promise(function(resolve,reject){
        var connection = mysql.createConnection({     
            host     : '39.108.58.83',       
            user     : 'root',              
            password : '1234',       
            port: '3306',                   
            database: 'TJW', 
        }); 
        
        connection.connect();

        var  sql = 'SELECT openId FROM dataOfTJW';
        //查
        connection.query(sql,function (err, result) {
                if(err){
                console.log('[SELECT ERROR] - ',err.message);
                return;
                }
        
            console.log('--------------------------SELECT----------------------------');
            console.log(result);
            var a=  JSON.parse(JSON.stringify(result,2))
            console.log('------------------------------------------------------------\n\n');  
            var re = findit(a,needToFind);
            console.log(re)
            
            resolve(re);
        });
        connection.end()
        
    })
}
//  遍历对象数组，查找
function findit(arr,val){
    for (var i=0;i<arr.length;i++){
        if(arr[i].openId == val){
            return arr[i].openId;
        }
    }
    return -1;
}

 // 提取content
 exports.getContentFromDB = function(openId){
     return new Promise(function(resolve,reject){

        var connection = mysql.createConnection({     
            host     : '39.108.58.83',       
            user     : 'root',              
            password : '1234',       
            port: '3306',                   
            database: 'TJW', 
        }); 
        
        connection.connect();

        var  sql = 'SELECT content FROM dataOfTJW where openId = ?';
        //查
        connection.query(sql,[openId],function (err, result) {
                if(err){
                console.log('[SELECT ERROR] - ',err.message);
                return;
                }
        
            console.log('--------------------------SELECT----------------------------');
            console.log(result);
            var a=  JSON.parse(JSON.stringify(result,2))
            console.log('------------------------------------------------------------\n\n');  
            if(a ==''){
                resolve('')
            }else{
            resolve(a[0].content)
                
            }
        });

        connection.end();
        
        
     }) 

}

// 提取play
exports.getPlayFromDB = function(){
    return new Promise(function(resolve,reject){
        var connection = mysql.createConnection({     
            host     : '39.108.58.83',       
            user     : 'root',              
            password : '1234',       
            port: '3306',                   
            database: 'TJW', 
        }); 
        
        connection.connect();

        var  sql = 'SELECT play FROM dataOfTJW';
        //查
        connection.query(sql,function (err, result) {
                if(err){
                console.log('[SELECT ERROR] - ',err.message);
                return;
                }
        
            console.log('--------------------------SELECT----------------------------');
            console.log(result);
            var a=  JSON.parse(JSON.stringify(result,2))
            console.log('------------------------------------------------------------\n\n');  
            console.log(a[0].play)
            resolve(a[0].play);
        });
        connection.end()

    })
}

// 添加openid;
exports.insert_openID = function(openId){
    return new Promise(function(resolve,reject){
        var connection = mysql.createConnection({     
            host     : '39.108.58.83',       
            user     : 'root',              
            password : '1234',       
            port: '3306',                   
            database: 'TJW', 
        }); 
        
        connection.connect();
        var play = 1;

        var  addSql = 'INSERT INTO dataOfTJW(Id,openId,play) VALUES(0,?,?)';
        var  addSqlParams = [openId,play];
        //增
        connection.query(addSql,addSqlParams,function (err, result) {
                if(err){
                console.log('[INSERT ERROR] - ',err.message);
                return;
                }        
            console.log('--------------------------INSERT openid----------------------------');
            console.log('INSERT ID:',result);        
            console.log('-----------------------------------------------------------------\n\n');  
            resolve();
        });
        
        connection.end();
    })


}

// 添加content

exports.insert_content= function(openId,content){

    return new Promise(function(resolve,reject){
        var connection = mysql.createConnection({     
            host     : '39.108.58.83',       
            user     : 'root',              
            password : '1234',       
            port: '3306',                   
            database: 'TJW', 
        }); 
        
        connection.connect();
        var modSql = 'UPDATE dataOfTJW SET content = ? WHERE openId = ?';
        var modSqlParams = [content,openId];
        //改
        connection.query(modSql,modSqlParams,function (err, result) {
        if(err){
                console.log('[UPDATE ERROR] - ',err.message);
                return;
        }        
        console.log('--------------------------UPDATE----------------------------');
        console.log('UPDATE affectedRows',result.affectedRows);
        console.log('-----------------------------------------------------------------\n\n');
        resolve();
        });
        
        connection.end();
    })
        
}


  // 添加sex
exports.insert_sex = function(sex,openId){

    return new Promise(function(resolve,reject){
          // 建立数据库长链接；
          var connection = mysql.createConnection({     
            host     : '39.108.58.83',       
            user     : 'root',              
            password : '1234',       
            port: '3306',                   
            database: 'TJW', 
        }); 
        
        connection.connect();
        var modSql = 'UPDATE dataOfTJW SET sex = ? WHERE openId = ?';
        var modSqlParams = [sex,openId];
        //改
        connection.query(modSql,modSqlParams,function (err, result) {
        if(err){
                console.log('[UPDATE ERROR] - ',err.message);
                return;
        }        
        console.log('--------------------------UPDATE----------------------------');
        console.log('UPDATE affectedRows',result.affectedRows);
        console.log('-----------------------------------------------------------------\n\n');
        resolve();
        });
        
        connection.end();
    })
   
}

   // 添加img
exports.insert_img = function(openId,imgUrl,imgId){

    return new Promise(function(resolve,reject){
        var connection = mysql.createConnection({     
            host     : '39.108.58.83',       
            user     : 'root',              
            password : '1234',       
            port: '3306',                   
            database: 'TJW', 
        }); 
        
        connection.connect();
        var modSql = 'UPDATE dataOfTJW SET imgUrl = ?,imgId = ? WHERE openId = ?';
        var modSqlParams = [imgUrl,imgId,openId];
        //改
        connection.query(modSql,modSqlParams,function (err, result) {
        if(err){
                console.log('[UPDATE ERROR] - ',err.message);
                return;
        }        
        console.log('--------------------------UPDATE----------------------------');
        console.log('UPDATE affectedRows',result.affectedRows);
        console.log('-----------------------------------------------------------------\n\n');
        resolve();
        });
        
        connection.end();
    })
   
}


// 添加voice
exports.insert_voiceId = function(openId,voiceId){

    return new Promise(function(resolve,reject){
        var connection = mysql.createConnection({     
            host     : '39.108.58.83',       
            user     : 'root',              
            password : '1234',       
            port: '3306',                   
            database: 'TJW', 
        }); 
        
        connection.connect();
        var modSql = 'UPDATE dataOfTJW SET voiceId = ? WHERE openId = ?';
        var modSqlParams = [voiceId,openId];
        //改
        connection.query(modSql,modSqlParams,function (err, result) {
        if(err){
                console.log('[UPDATE ERROR] - ',err.message);
                return;
        }        
        console.log('--------------------------UPDATE----------------------------');
        console.log('UPDATE affectedRows',result.affectedRows);
        console.log('-----------------------------------------------------------------\n\n');
        resolve();
        
        });
        
        connection.end();
    })
       
} 
    // 添加第一次留言
exports.insert_msg = function(openId,msg){

    return new Promise(function(resolve,reject){
        var connection = mysql.createConnection({     
            host     : '39.108.58.83',       
            user     : 'root',              
            password : '1234',       
            port: '3306',                   
            database: 'TJW', 
        }); 
        
        connection.connect();
        var modSql = 'UPDATE dataOfTJW SET msg = ? WHERE openId = ?';
        var modSqlParams = [msg,openId];
        //改
        connection.query(modSql,modSqlParams,function (err, result) {
        if(err){
                console.log('[UPDATE ERROR] - ',err.message);
                return;
        }        
        console.log('--------------------------UPDATE----------------------------');
        console.log('UPDATE affectedRows',result.affectedRows);
        console.log('-----------------------------------------------------------------\n\n');
        resolve();
        
        });
        
        connection.end();
        
    })
        
}
    // 添加第2次留言
exports.insert_msg_nd = function(openId,msg_nd){

    return new Promise(function(resolve,reject){
        var connection = mysql.createConnection({     
            host     : '39.108.58.83',       
            user     : 'root',              
            password : '1234',       
            port: '3306',                   
            database: 'TJW', 
        }); 
        
        connection.connect();
        var modSql = 'UPDATE dataOfTJW SET msg_nd = ? WHERE openId = ?';
        var modSqlParams = [msg_nd,openId];
        //改
        connection.query(modSql,modSqlParams,function (err, result) {
        if(err){
                console.log('[UPDATE ERROR] - ',err.message);
                return;
        }        
        console.log('--------------------------UPDATE----------------------------');
        console.log('UPDATE affectedRows',result.affectedRows);
        console.log('-----------------------------------------------------------------\n\n');
        resolve();
        
        });
        
        connection.end();

    })
        
}
    
    // 设定play为0
exports.zore_play = function(openId){

    return new Promise(function(resolve,reject){
        var connection = mysql.createConnection({     
            host     : '39.108.58.83',       
            user     : 'root',              
            password : '1234',       
            port: '3306',                   
            database: 'TJW', 
        }); 
        
        connection.connect();
        var modSql = 'UPDATE dataOfTJW SET play = ? WHERE openId = ?';
        var modSqlParams = [0,openId];
        //改
        connection.query(modSql,modSqlParams,function (err, result) {
        if(err){
                console.log('[UPDATE ERROR] - ',err.message);
                return;
        }        
        console.log('--------------------------UPDATE----------------------------');
        console.log('UPDATE affectedRows',result.affectedRows);
        console.log('-----------------------------------------------------------------\n\n');
        resolve();
        });
        
        connection.end();

    })
       
}

// 添加姓名和手机号码
exports.insert_contact = function(contact,openId){
    return new Promise(function(resolve,reject){
        var connection = mysql.createConnection({     
            host     : '39.108.58.83',       
            user     : 'root',              
            password : '1234',       
            port: '3306',                   
            database: 'TJW', 
        }); 
        
        connection.connect();
        var modSql = 'UPDATE dataOfTJW SET contact = ? WHERE openId = ?';
        var modSqlParams = [contact,openId];
        //改
        connection.query(modSql,modSqlParams,function (err, result) {
        if(err){
                console.log('[UPDATE ERROR] - ',err.message);
                return;
        }        
        console.log('--------------------------UPDATE----------------------------');
        console.log('UPDATE affectedRows',result.affectedRows);
        console.log('-----------------------------------------------------------------\n\n');
        resolve();
        });
        
        connection.end();

    })

}
   