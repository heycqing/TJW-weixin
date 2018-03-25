var array = [{
    id: 1,
    name: 'yc',
    age: 1
    },{
    id: 2,
    name: 'lqy',
    age: 2
}];

function getDateById(id){

    function findResult(data) {
        return data.id === id;
    }

    return array.find(findResult);
}

console.log(getDateById(2).age)