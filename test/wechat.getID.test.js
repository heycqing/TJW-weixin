var mysql = require('mysql')
var connection = mysql.createConnection({     
    host: '39.108.58.83',
    user: 'root',
    password: '1234',
    port: '3306',
    database: 'TJW',
}); 
 
connection.connect();

var  sql = "SELECT picId FROM getTheTJW where school= 'A' and sex = 'E'  ";


connection.query(sql,function (err, result) {
    if(err){
    console.log('[SELECT ERROR] - ',err.message);
    return;
    }

console.log('--------------------------SELECT----------------------------');
getID = result;
console.log(Math.floor(Math.random()*getID.length))
var a = Math.floor(Math.random()*getID.length);
console.log(getID.length)
// console.log(getID)
console.log(getID[a].picId)
console.log(result[0].picId)
console.log('------------------------------------------------------------\n\n');  
});


connection.end();