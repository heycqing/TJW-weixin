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

exports.parseXMlAsync = function(xml){
return new Promise(function(resolve,reject){
    xml2js.parseString(xml,{trim:true},function(err,content){
        if(err){
            reject(err)
        }else{
            reslove(content)
        }
    })
})
}