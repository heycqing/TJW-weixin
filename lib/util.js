var fs = require('fs');
var xml2js = require('xml2js');
var Promise = require('bluebird');

exports.readFileAsync = function(fpath,encoding){
    return new Promise(function(resolve,reject){
        fs.readFile(fpath,encoding,function(err,content){
            if(err){
                reject(err);
            }else{
                resolve(content);
            }
        });
    });
}

exports.writeFileAsync = function (fpath,encoding){
    return new Promise(function(resolve,reject){
        fs.writeFile(fpath,encoding,function(err,content){
            if(err){
                reject(err);
            }else{
                resolve(content);
            }
        })
    })
}

exports.parseXMLAsync = function(xml){
return new Promise(function(resolve,reject){
    xml2js.parseString(xml,{trim:true},function(err,content){
        if(err){
            reject(err)
        }else{
            resolve(content)
        }
    })
})
}


function formatMsg(result){
    // console.log('有没有执行')
    var msg = {};
    // console.log('msg____是：'+msg)

    if(typeof result === 'object'){
        var keys = Object.keys(result);
        console.log('keys是:'+keys);
        
        for(var i= 0;i<keys.length;i++){

            var item = result[keys[i]];
            var key = keys[i];

            if(!(item instanceof Array) || item.length === 0){
                continue;
            }

            if(item.length === 1){
                var val = item[0];

                if(typeof val === 'object'){
                    msg[key] = formatMsg(val);
                }else{
                    msg[key] = (val || '').trim();
                }
                // console.log('长度为1！')

            }else{
                msg[key] = [];
                for (var j= 0, k=item.length; j<k;j++){
                    msg[key].push(formatMsg(item[j]));
                }
                // console.log('执行了数组；')
            }

        }
        

    }
    console.log('msg.MsgType是:'+msg.MsgType);
    console.log("处理之后的json数据："+JSON.stringify(msg,''));
    return msg;
}


exports.formatMsg = formatMsg;

