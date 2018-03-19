var a =[{id:1},{id:2},{name:'cc'}];
var b = {id:1};
console.log(JSON.stringify(a));
console.log(JSON.stringify(a).indexOf(JSON.stringify(b))!=-1);

var duixiang= [{
    id:"1",
    name:"www"
},{
    id:"2",
    name:'weee'
},{
    id:"3",
    name:'rrr'
},{
    id:"4",
    name:'ggge'
}]

function findElem(arr,attr,val){
    for (var i=0;i<arr.length;i++){
        if(arr[i][attr] == val){
            return i;
        }
    }
    return -1;
}

console.log(findElem(duixiang,'id','3'))