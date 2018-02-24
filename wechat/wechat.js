var sha1 = require('sha1');

module.exports = function(opt){
    return function *(next){
        console.log(this.query);
        
        var token = opt.token;
        var signature = this.query.signature;
        var nonce = this.query.nonce;
        var timestamp = this.query.timestamp;
        var echostr =  this.query.echostr;
    
        var str = [token,timestamp,nonce].sort().join('');
        var sha = sha1(str);
        console.log(str);
        console.log(sha);
    
        if(sha === signature){
            this.body = echostr+'';
            console.log('相等');
    
        }else{
            this.body = 'wrong!';
            console.log('wrong!');
        }
    }
}