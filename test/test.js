var a = [{
    id:0,
    name:'fff'
},{
    id:1,
    name:'ggg'
},{
    id:0,
    name:'rrr'
},{
    id:0,
    name:'jjj'
},{
    id:1,
    name:'qqq'
},{
    id:0,
    name:'ccc'
},{
    id:1,
    name:'vvv'
}]
function findit(arr){
    for (var i=0;i<arr.length;i = Math.floor(Math.random()*arr.length)){
        if(arr[i].id == 1){
            return arr[i].name;
        }
    }
    return -1;
}
console.log('fins it '+findit(a))

