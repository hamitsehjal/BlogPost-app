/*********************************************************************************
*  WEB322 – Assignment 04
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: HAMIT SEHJAL Student ID: 139238208 Date: 2022-0-11
*
*  Online (Heroku) URL: https://murmuring-lake-04378.herokuapp.com/
*
*  GitHub Repository URL: https://github.com/hamitsehjal/web322-app
*
********************************************************************************/




const express = require("express");
const app = express();

const blogData = require("./blog-service");
const path = require("path");
const { json } = require("express/lib/response");

const env = require("dotenv").config()

const multer = require("multer")
const cloudinary = require("cloudinary").v2
const streamifier = require("streamifier")

const exphbs = require("express-handlebars")

const stripJs = require('strip-js');

app.engine('.hbs', exphbs.engine({
  extname: '.hbs', helpers: {
    navLink: function (url, options) {
      return '<li' +
        ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
        '><a href="' + url + '">' + options.fn(this) + '</a></li>';
    },
    equal: function (lvalue, rvalue, options) {
      if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
      if (lvalue != rvalue) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    },
    safeHTML: function (context) {
      return stripJs(context);
    }



  }
}));
app.set('view engine', '.hbs');

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


// Important Step
app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute = (route == "/") ? "/" : "/" + route.replace(/\/(.*)/, "");
  app.locals.viewingCategory = req.query.category;
  next();
});



// setup a 'route' to listen on the default url path (http://localhost)
app.get("/", function (req, res) {
  res.redirect('/blog');
});


// setup another route to listen on /about
app.get("/about", function (req, res) {
  res.render('about', {
    data: null,
    layout: "main"
  })
});

// setup route to listen on /blog

app.get('/blog', async (req, res) => {

  // Declare an object to store properties for the view
  let viewData = {};

  try {

    // declare empty array to hold "post" objects
    let posts = [];

    // if there's a "category" query, filter the returned posts by category
    if (req.query.category) {
      // Obtain the published "posts" by category
      posts = await blogData.getPublishedPostsByCategory(req.query.category);
    } else {
      // Obtain the published "posts"
      posts = await blogData.getPublishedPosts();
    }

    // sort the published posts by postDate
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // get the latest post from the front of the list (element 0)
    let post = posts[0];

    // store the "posts" and "post" data in the viewData object (to be passed to the view)
    viewData.posts = posts;
    viewData.post = post;

  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await blogData.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results"
  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", { data: viewData, layout: "main" })

});

// listening on "/blog/:id"
app.get('/blog/:id', async (req, res) => {

  // Declare an object to store properties for the view
  let viewData = {};

  try {

    // declare empty array to hold "post" objects
    let posts = [];

    // if there's a "category" query, filter the returned posts by category
    if (req.query.category) {
      // Obtain the published "posts" by category
      posts = await blogData.getPublishedPostsByCategory(req.query.category);
    } else {
      // Obtain the published "posts"
      posts = await blogData.getPublishedPosts();
    }

    // sort the published posts by postDate
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // store the "posts" and "post" data in the viewData object (to be passed to the view)
    viewData.posts = posts;

  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the post by "id"
    viewData.post = await blogData.getPostById(req.params.id);
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await blogData.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results"
  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", { data: viewData })
});

// setup route to listen on /posts
// 	This route will return a JSON formatted string containing all the posts within the posts.json files

app.get("/posts", function (req, res) {
  // setup route to listen on /posts?category=value 
  if (req.query.category) {
    blogData.getPostsByCategory(req.query.category).then((data) => {
      res.render('posts', {
        posts: data,
        layout: "main"
      })
    }).catch((err) => {
      res.render("posts", { message: "no results", layout: "main" });
    })
  }
  // setup routes to listen on 	/posts?minDate=value
  else if (req.query.minDate) {
    blogData.getPostsByMinDate(req.query.minDate).then((data) => {
      res.render('posts', {
        posts: data,
        layout: "main"
      })
    }).catch((err) => {
      res.render("posts", { message: "no results", layout: "main" });
    })
  }
  else {
    blogData.getAllPosts().then((data) => {
      res.render('posts', {
        posts: data,
        layout: "main"
      })
    }).catch((err) => {
      res.render("posts", { message: "no results", layout: "main" });
    })
  }
});





// setup route to listen to /posts/add
app.get("/posts/add", (req, res) => {
  res.render('addPost', {
    data: null,
    layout: "main"
  })
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
    blogData.addPosts(req.body).then(() => {
      res.redirect("/posts");
    }).catch((err) => {
      res.send({ message: err })
    })


    // TODO: Process the req.body and add it as a new Blog Post before redirecting to /posts

  }

})

// setup route to listen on "/post/value" 
app.get("/post/:id", (req, res) => {
  blogData.getPostById(req.params.id).then((post) => {
    res.json(post)
  }).catch((err) => {
    res.send({ message: err })
  })
})
// setup route to listen on /categories
app.get("/categories", (req, res) => {
  blogData.getCategories().then((data) => {
    res.render('categories', {
      categories: data,
      layout: "main"
    })
  }).catch((err) => {
    res.render('categories', { message: "no results", layout: "main" })
  })
});




// In case, no matching route exits
app.use((req, res) => {
  // res.status(404).send("PAGE NOT FOUND");
  //res.sendFile(path.join(__dirname, "/views/404.html"));
  res.render('404',{data:null,layout:"error"})
})

// setup http server to listen on HTTP_PORT
blogData.initialize().then(() => {
  app.listen(HTTP_PORT, onHttpStart)
}).catch((err) => {
  console.log(err)
})



