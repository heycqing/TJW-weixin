var rp = require('request-promise');

var options = {
    method: 'POST',
    uri: 'http://api.posttestserver.com/post',
    body: {
        some: 'payload'
    },
    json: true // Automatically stringifies the body to JSON
};
 
rp(options)
    .then(function (parsedBody) {
        // POST succeeded...
        console.log('成功！')
    })
    .catch(function (err) {
        // POST failed...
    });