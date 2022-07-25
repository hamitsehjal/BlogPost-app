


const Sequelize = require('sequelize');
var sequelize = new Sequelize('d5mkelneb266nq', 'ighleyfabascco', 'ce528de01a99afafa299d6ae3ece18d5705e296ca48b06332e9ffa39eafafe20', {
    host: 'ec2-54-161-255-125.compute-1.amazonaws.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});


var Post = sequelize.define('Post', {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN

})

var Category = sequelize.define('Category', {
    category: Sequelize.STRING
})

// Relationship between Tables
Post.belongsTo(Category, { foreignKey: 'category' });

// initialize function

module.exports.initialize = () => {
    return new Promise((resolve, reject) => {
        sequelize.sync().then(() => {
            resolve('CONNECTION SUCCESSFUL !!');
        }).catch((err) => {
            reject("unable to sync the database");
        })
    });
}

// getAllPosts() function:

module.exports.getAllPosts = () => {
    return new Promise((resolve, reject) => {
        Post.findAll().then((data) => {
            resolve(data)
        }).catch((err) => {
            reject('no results returned');

        })
    });

}



//getPublishedPosts function:

module.exports.getPublishedPosts = () => {
    return new Promise((resolve, reject) => {
        Post.findAll({
            where: {
                published: true
            }
        }).then((data) => {
            resolve(data)
        }).catch((err) => {
            reject("no results returned")
        });
    });


}


//getCategories()

module.exports.getCategories = () => {
    return new Promise((resolve, reject) => {
        Category.findAll().then((data) => {
            resolve(data)
        }).catch((err) => {
            reject("no results returned")
        })
    });

}


// Adding a Post
module.exports.addPosts = (postData) => {
    return new Promise((resolve, reject) => {

        
        for (var post in postData) {
            if (postData[post] == "") {
                postData[post] = null;
            }

        }
        postData.published = (postData.published) ? true : false;

        postData.postDate = new Date().toISOString().slice(0, 10);;

        Post.create(postData).then((data) => {
            resolve(data);
        }).catch((err) => {
            reject('unable to create post')
        })
    });
}

// Adding a Category

module.exports.addCategory = (categoryData) => {
    return new Promise((resolve, reject) => {

        for (var category in categoryData) {
            if (categoryData[category] == "") {
                categoryData[category] = null;
            }

        }

        Category.create(categoryData).then((data) => {
            resolve(data);
        }).catch((err) => {
            reject('unable to create category')
        })
    });
}

// Deleting category by id
module.exports.deleteCategoryById = (id) => {
    return new Promise((resolve, reject) => {
        Category.destroy({ where: { id: id } }).then((data) => {
            resolve(data);
        }).catch((err) => {
            reject(err)
        })
    })
}


// Deleting post by id
module.exports.deletePostById = (id) => {
    return new Promise((resolve, reject) => {
        Post.destroy({ where: { id: id } }).then((data) => {
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    })
}

///posts?category=value 

module.exports.getPostsByCategory = (category_Value) => {
    return new Promise((resolve, reject) => {
        Post.findAll({
            where: { category: category_Value }
        }).then((data) => {
            resolve(data)
        }).catch((err) => {
            reject("no results returned")
        })
    });
}

//getPostsByMinDate(minDateStr)

module.exports.getPostsByMinDate = (minDateStr) => {
    return new Promise((resolve, reject) => {
        const { gte } = Sequelize.Op;

        Post.findAll({
            where: {
                postDate: {
                    [gte]: new Date(minDateStr)
                }
            }
        }).then((data) => {
            resolve(data)
        }).catch((err) => {
            reject("no results returned")
        })

    });
}

// getPostById(id) 

module.exports.getPostById = (id_Value) => {
    return new Promise((resolve, reject) => {
        Post.findAll({
            where: { id: id_Value }
        }).then((data) => {
            resolve(data[0]);
        }).catch((err) => {
            reject("no results returned")
        })
    });
}


module.exports.getPublishedPostsByCategory = (category_Value) => {
    return new Promise((resolve, reject) => {
        Post.findAll({
            where: {
                published: true,
                category: category_Value
            }
        }).then((data) => {
            resolve(data)
        }).catch((err) => {
            reject("no results returned");
        })
    });
}
