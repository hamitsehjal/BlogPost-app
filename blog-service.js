const fs=require("fs");

var posts=[]
var categories=[]

// initialize function

module.exports.initialize=()=>{
    return new Promise((resolve,reject)=>{
        fs.readFile("./data/posts.json","utf-8",(err,data)=>
        {
            if(err)
            {
                reject("unable to read file")
                //console.log("unable to read file")
            }
            else
            {
                posts=JSON.parse(data)
                fs.readFile("./data/categories.json","utf-8",(err,data)=>{
                    if(err)
                    {
                        reject("unable to read file")
                        //console.log("unable to read file")
                    }
                    else{
                        categories=JSON.parse(data);
                        resolve("SUCCESS")
                    }
                })
            }
        })
    })
}

// getAllPosts() function:

module.exports.getAllPosts=()=>{
    return new Promise((resolve,reject)=>{
        if(posts.length===0)
        {
            reject("no results returned")
        }

        resolve(posts)
    })
}



//getPublishedPosts function:

module.exports.getPublishedPosts=()=>
{
    let publishedPosts=[]
    return new Promise((resolve,reject)=>
    {
        for(var i=0;i<posts.length;i++)
        {
            if(posts[i].published===true)
            {
                publishedPosts.push(posts[i])
            }
        }
        if(publishedPosts.length==0)
        {
            reject("no results returned")
        }
        resolve(publishedPosts);
    })

    
}


//getCategories()

module.exports.getCategories=()=>{
    return new Promise((resolve,reject)=>
    {
        if(categories.length===0)
        {
            reject("no results returned")
        }

        resolve(categories)
    })

}