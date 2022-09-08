




const express = require("express");
const app = express();

const blogData = require("./blog-service");
const authData = require("./auth-service");
const path = require("path");
const { json, redirect } = require("express/lib/response");

const env = require("dotenv").config()

const multer = require("multer")
const cloudinary = require("cloudinary").v2
const streamifier = require("streamifier")

const exphbs = require("express-handlebars")

const stripJs = require('strip-js');

const clientSessions = require("client-sessions");
const { resolve } = require("path");

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
    },
    formatDate: function (dateObj) {
      let year = dateObj.getFullYear();
      let month = (dateObj.getMonth() + 1).toString();
      let day = dateObj.getDate().toString();
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }




  }
}));
app.set('view engine', '.hbs');

// Setup client-sessions
app.use(clientSessions({
  cookieName: "session", // this is the object name that will be added to 'req'
  secret: "Final_Assignment_web322", // this should be a long un-guessable string.
  duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
  activeDuration: 1000 * 60 // the session will be extended by this many ms each request (1 minute)
}));

app.use(function (req, res, next) {
  res.locals.session = req.session;
  next();
})

// ensure login function
//
function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}
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

app.use(express.urlencoded({ extended: true }));

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
app.get('/blog/:id', ensureLogin, async (req, res) => {

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

app.get("/posts", ensureLogin, function (req, res) {
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
      if (data.length > 0) {
        res.render('posts', {
          posts: data,
          layout: "main"
        })
      }
      else {
        res.render("posts", { message: "no results" });
      }
    }).catch((err) => {
      res.render("posts", { message: "no results", layout: "main" });
    })
  }
});




// setup route to listen to /posts/add
app.get("/posts/add", ensureLogin, (req, res) => {
  blogData.getCategories().then((data) => {
    res.render("addPost",
      {
        categories: data,
        layout: "main"
      });
  }).catch(() => {
    res.render("addPost",
      {
        categories: [],
        layout: "main"
      });
  })
})

// setting the route to post on /posts/add
app.post("/posts/add", ensureLogin, upload.single("featureImage"), (req, res) => {
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


  }

})

// setup route to listen to /categories/add
app.get("/categories/add", ensureLogin, (req, res) => {
  res.render('addCategory', {
    data: null,
    layout: "main"
  })
})

// setting the route to post on /categories/add
app.post("/categories/add", ensureLogin, (req, res) => {
  blogData.addCategory(req.body).then(() => {
    res.redirect("/categories");
  }).catch((err) => {
    res.send({ message: err })
  })

})
// setup route to listen on "/post/value" 
app.get("/post/:id", ensureLogin, (req, res) => {
  blogData.getPostById(req.params.id).then((post) => {
    res.json(post)
  }).catch((err) => {
    res.send({ message: err })
  })
})
// setup route to listen on /categories
app.get("/categories", ensureLogin, (req, res) => {
  blogData.getCategories().then((data) => {
    if (data.length > 0) {
      res.render('categories', {
        categories: data,
        layout: "main"
      })
    }
    else {
      res.render("Categories", { message: "no results" });

    }
  }).catch((err) => {
    res.render('categories', { message: "no results", layout: "main" })
  })
});

// Listening on route "/categories/delete/:id"
app.get("/categories/delete/:id", ensureLogin, (req, res) => {
  blogData.deleteCategoryById(req.params.id).then((data) => {
    res.redirect("/categories");
  }).catch((err) => {
    res.status(500).send({ message: "Unable to Remove Category / Category not found)" })
  })
})

// Listening on route "/posts/delete/:id"
app.get("/posts/delete/:id", ensureLogin, (req, res) => {
  blogData.deletePostById(req.params.id).then((data) => {
    res.redirect("/posts");
  }).catch((err) => {
    res.status(500).send({ message: "Unable to Remove Post / Post not found)" })
  })
})


// GET/login
//
app.get("/login", (req, res) => {
  res.render('login',
    {
      data: null,
      layout: 'main'
    })
})

// POST/login
//
app.post("/login", (req, res) => {
  req.body.userAgent = req.get('User-Agent');
  authData.checkUser(req.body).then((user) => {
    req.session.user = {
      userName: user.userName,
      email: user.email,
      loginHistory: user.loginHistory
    }
    res.redirect('/posts');
  }).catch((error) => {
    res.render('login', {
      errorMessage: error,
      userName: req.body.userName,
      layout: 'main'
    })
  })
})
// GET/register
//
app.get("/register", (req, res) => {
  res.render('register', {
    data: null,
    layout: 'main'
  })
})
// POST/register
//
app.post("/register", (req, res) => {
  authData.registerUser(req.body).then((data) => {
    res.render('register', {
      successMessage: "User Created",
      layout:'main'
    })
  }).catch((err) => {
    res.render('register', {
      errorMessage: err,
      userName: req.body.userName,
      layout:'main'
    })
  })
})

// GET/ logout
app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
})

// GET/ userHistory
app.get("/userHistory", ensureLogin, (req, res) => {
  res.render('userHistory', {
    data: null,
    layout: 'main'
  })
})
// In case, no matching route exits
app.use((req, res) => {
  res.render('404', { data: null, layout: "error" })
})

// setup http server to listen on HTTP_PORT
blogData.initialize().then(authData.initialize).then(() => {
  app.listen(HTTP_PORT, onHttpStart)
}).catch((err) => {
  console.log("Unable to start server: " + err)
})



