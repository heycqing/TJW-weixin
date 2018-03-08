var mysql = require('mysql')
var  sql = "SELECT picId FROM getTheTJW where school= 'A' and sex = 'E'  ";

    var connection = mysql.createConnection({     
        host: '39.108.58.83',
        user: 'root',
        password: '1234',
        port: '3306',
        database: 'TJW',
    }); 
    connection.connect();
    var select=function(sql,callback){
        connection.query(sql,function(err,data){
            if(err){console.log(err)}
            callback(data[0].picId)
        })
    };
    
    function processdata(data){
        console.log("data是:"+data);
        //  temp = data;
        // console.log("temp是:"+temp);
        
    }
    select(sql,processdata)

 
// console.log("结果是:"+);
// console.log("temp是:"+temp);


