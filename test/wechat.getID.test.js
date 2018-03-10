var mysql = require('mysql')

// console.log(this)
   
console.log(this)
    var select=function(callback){

        var  sql = "SELECT picId FROM getTheTJW where school= 'A' and sex = 'E'  ";
        
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
            // console.log("b is "+b)
            // 作为参数传递出去
            // console.log(this)
           return callback(data[0].picId)
        })
       
    };
    
    function processdata(data){
        console.log("data是:"+data);


        console.log(this)
        return data;
   
    }


  
 console.log(select(processdata));




