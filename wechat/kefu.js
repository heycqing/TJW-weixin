var fs = require('fs');
var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var path = require('path')






exports.getKefuInfo = function(access_token_0,msgUser){
    console.log('access_token是： '+ access_token_0);
    // var dd =JSON.stringify(msgFromUser)
        
        var url = 'https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token='+access_token_0;
        // var msgUser = 'oRFFw07pJC1DfxCv7N5oRU0ANePw';
        var requestData ={
            touser:msgUser,
            msgtype:"text",
            text:
            {
                 "content":"Hello World+1",
            }
        }
        request({
            method: 'Post',
            url: url,
            json:true,
            headers: {
                "content-type": "application/json",
            },
            body: requestData
        })
        .then(function(response){
            console.log("客服消息是："+response.body.errmsg);
            console.log("客服消息："+response.body.errcode)
        })
}

// setTimeout(function(temp){
                
//     var url = 'https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token='+access_token_0;
//     var msgUser = 'oRFFw07pJC1DfxCv7N5oRU0ANePw';
//     var requestData ={
//         touser:msgUser,
//         msgtype:"text",
//         text:
//         {
//             "content":"Hello World+1",
//         }
//     }
//     request({
//         method: 'Post',
//         url: url,
//         json:true,
//         headers: {
//             "content-type": "application/json",
//         },
//         body: requestData
//     })
//     .then(function(response){
//         console.log("客服消息是："+response.body.errmsg);
//         console.log("客服消息："+response.body.errcode)
//         var data = response.body.errmsg;
//     })
// },5000)