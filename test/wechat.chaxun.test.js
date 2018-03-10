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