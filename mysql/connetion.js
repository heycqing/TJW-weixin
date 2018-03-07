var mysql  = require('mysql');  
 
var connection = mysql.createConnection({     
    host: '39.108.58.83',
    user: 'root',
    password: '1234',
    port: '3306',
    database: 'TJW',
}); 
 
connection.connect();
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
var time = date2str(new Date(), "yyyy-MM-d h:m:s:ms");
 
var  addSql = 'INSERT INTO getTheTJW(school,sex,time) VALUES(?,?,?)';

var  addSqlParams = [temp_school,temp_sex,time];

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