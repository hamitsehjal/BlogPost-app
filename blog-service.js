const fs = require("fs");

var posts = []
var categories = []

// initialize function

module.exports.initialize = () => {
    return new Promise((resolve, reject) => {
        fs.readFile("./data/posts.json", "utf-8", (err, data) => {
            if (err) {
                reject("unable to read file")
                //console.log("unable to read file")
            }
            else {
                posts = JSON.parse(data)
                fs.readFile("./data/categories.json", "utf-8", (err, data) => {
                    if (err) {
                        reject("unable to read file")
                        //console.log("unable to read file")
                    }
                    else {
                        categories = JSON.parse(data);
                        resolve("SUCCESS")
                    }
                })
            }
        })
    })
}

// getAllPosts() function:

module.exports.getAllPosts = () => {
    return new Promise((resolve, reject) => {
        if (posts.length === 0) {
            reject("no results returned")
        }

        resolve(posts)
    })
}



//getPublishedPosts function:

module.exports.getPublishedPosts = () => {
    let publishedPosts = []
    return new Promise((resolve, reject) => {
        for (var i = 0; i < posts.length; i++) {
            if (posts[i].published === true) {
                publishedPosts.push(posts[i])
            }
        }
        if (publishedPosts.length == 0) {
            reject("no results returned")
        }
        resolve(publishedPosts);
    })


}


//getCategories()

module.exports.getCategories = () => {
    return new Promise((resolve, reject) => {
        if (categories.length === 0) {
            reject("no results returned")
        }

        resolve(categories)
    })

}



module.exports.addPosts = (addPost) => {
    return new Promise((resolve, reject) => {
        if (addPost) {
            if (typeof addPost.published === 'undefined') {
                addPost.published = false;
            }
            else {
                addPost.published = true;
            }
            // setting the id of the new post
            addPost.id = posts.length + 1;

            // adding new post to posts array
            posts.push(addPost);

            resolve(posts)
        }
        else {
            reject("No Albums Found!!")
        }

    })
}



///posts?category=value 

module.exports.getPostsByCategory = (category) => {
    return new Promise((resolve, reject) => {
        var posts_by_category = [];

        for (let i = 0; i < posts.length; i++) {
            if (posts[i].category == category) {
                posts_by_category.push(posts[i]);
            }
        }
        if (posts_by_category.length > 0) {
            resolve(posts_by_category)
        }
        else {
            reject("No results returned")
        }
    })
}

//getPostsByMinDate(minDateStr)

module.exports.getPostsByMinDate = (minDateStr) => {
    return new Promise((resolve, reject) => {
        var posts_by_Date = [];
        for (let i = 0; i < posts.length; i++) {
            if (new Date(posts[i].postDate) >= new Date(minDateStr)) {
                posts_by_Date.push(posts[i]);
            }

        }

        if (posts_by_Date.length > 0) {
            resolve(posts_by_Date)
        }
        else {
            reject("no results returned")
        }
    })
}

// getPostById(id) 

module.exports.getPostById = (id) => {
    return new Promise((resolve, reject) => {
        var posts_by_Id;

        for (let i = 0; i < posts.length; i++) {
            if (posts[i].id == id) {
                posts_by_Id = posts[i]
            }
        }

        if (posts_by_Id) {
            resolve(posts_by_Id)
        }
        else {
            reject("No Post Found!!!!")
        }
    })
}

