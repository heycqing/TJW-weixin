function multiply(input) {
    return new Promise(function (resolve, reject) {
        // log('calculating ' + input + ' x ' + input + '...');
        // setTimeout(resolve, 500, input * input);
        if(input == '2'){
            console.log('ss')
        }
        setTimeout(resolve,500)
    });
}

// 0.5秒后返回input+input的计算结果:
function add(input) {
    return new Promise(function (resolve, reject) {
        // log('calculating ' + input + ' + ' + input + '...');
        // setTimeout(resolve, 500, input + input);
        if(input == '3'){
            console.log('333333')
        }
        setTimeout(resolve,500)
        
    });
}

var p = new Promise(function (resolve, reject) {
    console.log('start new Promise...');
    resolve(3);
});

p.then(multiply)
 .then(add)
 .then(function () {
    console.log('Got value: ' );
});
