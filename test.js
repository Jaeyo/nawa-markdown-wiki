function test1(){
    return new Promise(function(resolve, reject){
        resolve(null); 
    });
}; //test1

function test2(){
    return new Promise(function(resolve, reject){
        resolve('asdf'); 
    });
}; //test2

Promise.all([test1(), test2()])
.then(function(data){
    console.log(data[0]);
    console.log(data[1]);
}).catch(function(e){
   console.log({e: e});  
});