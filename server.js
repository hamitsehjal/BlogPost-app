var express = require("express");
var app = express();

var blog=require("./blog-service");

var path = require("path");
const { json } = require("express/lib/response");

var HTTP_PORT = process.env.PORT || 8080;

// call this function after the http server starts listening for requests
function onHttpStart() {
  console.log("Express http server listening on: " + HTTP_PORT);
}

app.use(express.static('public')); 

// setup a 'route' to listen on the default url path (http://localhost)
app.get("/", function(req,res){
    res.redirect('/about');
});


// setup another route to listen on /about
app.get("/about", function(req,res){
    res.sendFile(path.join(__dirname,"/views/about.html"));
  });

// setup route to listen on /blog
app.get("/blog",function(req,res)
{
  //	This route will return a JSON formatted string containing all of the posts within the posts.json 
  //file whose published property is set to true (ie: "published" posts).
  blog.getPublishedPosts().then((data)=>{
    res.json(data)
  }).catch((err)=>{
    res.send({message:err})
  })

});

// setup route to listen on /posts
//	This route will return a JSON formatted string containing all the posts within the posts.json files

app.get("/posts",function(req,res)
{
  blog.getAllPosts().then((data)=>{
    res.json(data)
  }).catch((err)=>{
      res.send({message:err})
  })

});


// setup route to listen on /categories
app.get("/categories",function(req,res)
{
  blog.getCategories().then((data)=>{
    res.json(data)
  }).catch((err)=>{
      res.send({message:err})
  })
});

// In case, no matching route exits
app.use((req,res)=>{
  // res.status(404).send("PAGE NOT FOUND");
  res.sendFile(path.join(__dirname,"/views/404.html"));
})

// setup http server to listen on HTTP_PORT
blog.initialize().then(()=>{
    app.listen(HTTP_PORT,onHttpStart)
}).catch((err)=>{
      console.log(err)
})