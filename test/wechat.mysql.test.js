var mysql = require('mysql')

   var connection = mysql.createConnection({     
    host     : '39.108.58.83',       
    user     : 'root',              
    password : '1234',       
    port: '3306',                   
    database: 'TJW', 
}); 

connection.connect();


function b(){
    var  sql = 'SELECT content FROM dataOfTJW';
    //查
    connection.query(sql,function (err, result) {
            if(err){
            console.log('[SELECT ERROR] - ',err.message);
            return;
            }

        console.log('--------------------------SELECT----------------------------');
        console.log(result);
        var a=  JSON.parse(JSON.stringify(result))
        console.log('------------------------------------------------------------\n\n');  
        console.log(a);
        console.log(a[0].content)
        return a[0].content;
        
        
    });

    connection.end();
}
console.log(b)