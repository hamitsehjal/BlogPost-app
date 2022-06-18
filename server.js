/*********************************************************************************
*  WEB322 – Assignment 02
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: HAMIT SEHJAL Student ID: 139238208 Date: 2022-06-03
*
*  Online (Heroku) URL: https://murmuring-lake-04378.herokuapp.com/
*
*  GitHub Repository URL: https://github.com/hamitsehjal/web322-app
*
********************************************************************************/




const express = require("express");
const app = express();

const blog = require("./blog-service");

const path = require("path");
const { json } = require("express/lib/response");

const env = require("dotenv").config()

const multer = require("multer")
const cloudinary = require("cloudinary").v2
const streamifier = require("streamifier")

// configuring my cloudinary

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
  secure: true
})

const HTTP_PORT = process.env.PORT

const upload = multer(); // since we are not using disk storage

// call this function after the http server starts listening for requests
function onHttpStart() {
  console.log("Express http server listening on: " + HTTP_PORT);
}




// setup a 'route' to listen on the default url path (http://localhost)
app.get("/", function (req, res) {
  res.redirect('/about');
});


// setup another route to listen on /about
app.get("/about", function (req, res) {
  res.sendFile(path.join(__dirname, "/views/about.html"));
});

// setup route to listen on /blog
app.get("/blog", function (req, res) {
  //	This route will return a JSON formatted string containing all of the posts within the posts.json 
  //file whose published property is set to true (ie: "published" posts).
  blog.getPublishedPosts().then((data) => {
    res.json(data)
  }).catch((err) => {
    res.send({ message: err })
  })

});

// setup route to listen on /posts
// 	This route will return a JSON formatted string containing all the posts within the posts.json files

app.get("/posts", function (req, res) {
  // setup route to listen on /posts?category=value 
  if(req.query.category){
    blog.getPostsByCategory(req.query.category).then((data) => {
      res.json(data)
    }).catch((err) => {
      res.send({message:errMsg})
    })
  }
// setup routes to listen on 	/posts?minDate=value
  else if(req.query.minDate){
    blog.getPostsByMinDate(req.query.minDate).then((data) => {
      res.json(data)
    }).catch((err) => {
      res.send({message:errMsg})
    })
  }
  else{
    blog.getAllPosts().then((data) => {
      res.json(data)
    }).catch((err) => {
      res.send({message:errMsg})
    })
  }
});



// setup route to listen on "/post/value" 
app.get("/post/:id", (req, res) => {
  blog.getPostById(req.params.id).then((post) => {
    res.json(post)
  }).catch((err) => {
    res.send({message:err})
  })
})

// setup route to listen to /posts/add
app.get("/posts/add", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/addPost.html"))
})

// setting the route to post on /posts/add
app.post("/posts/add", upload.single("featureImage"), (req, res) => {
  if (req.file) {
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream(
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    async function upload(req) {
      let result = await streamUpload(req);
      console.log(result);
      return result;
    }

    upload(req).then((uploaded) => {
      processPost(uploaded.url);
    });
  } else {
    processPost("");
  }

  function processPost(imageUrl) {
    req.body.featureImage = imageUrl;
    blog.addPosts(req.body).then(() => {
      res.redirect("/posts");
    }).catch((err) => {
      res.send({message:err})
    })


    // TODO: Process the req.body and add it as a new Blog Post before redirecting to /posts

  }

})

// setup route to listen on /categories
app.get("/categories", (req, res) => {
  blog.getCategories().then((data) => {
    res.json(data)
  }).catch((err) => {
    res.send({ message: err })
  })
});




// In case, no matching route exits
app.use((req, res) => {
  // res.status(404).send("PAGE NOT FOUND");
  res.sendFile(path.join(__dirname, "/views/404.html"));
})

// setup http server to listen on HTTP_PORT
blog.initialize().then(() => {
  app.listen(HTTP_PORT, onHttpStart)
}).catch((err) => {
  console.log(err)
})



