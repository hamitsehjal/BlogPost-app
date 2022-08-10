var mongoose = require("mongoose")
var Schema = mongoose.Schema

const bcrypt = require("bcryptjs");

var userSchema = new Schema({
    "userName": {
        type: String,
        unique: true
    },
    "password": String,
    "email": String,
    "loginHistory": [{
        "dateTime": Date,
        "userAgent": String
    }]
})

let User; // to be defined on new connection (see initialize)

// initialize function
//
module.exports.initialize = () => {
    return new Promise((resolve, reject) => {
        let db = mongoose.createConnection("mongodb+srv://Hamit:mongodb322@senecaweb322.fftbh2y.mongodb.net/web322_Final_assignment?retryWrites=true&w=majority");

        db.on('error', (err) => {
            console.log("COULDN'T CONNECT TO MONGO DB!")
            reject(err); // reject the promise with the provided error
        });
        db.once('open', () => {
            console.log("MONGO DB CONNECTED SUCCESSFULLY!")
            User = db.model("users", userSchema);
            resolve();
        })
    })
}

// registerUser(userData)
//
module.exports.registerUser = (userData) => {
    return new Promise((resolve, reject) => {
        if (userData.password != userData.password2) {
            reject("Passwords do not match")
        }
        else {
            bcrypt.hash(userData.password, 10).then((hash) => {
                userData.password = hash;
                var newUser = new User(userData);
                newUser.save().then(() => {
                    resolve();
                }).catch((err) => {
                    if (err.code === 11000) {
                        reject("User Name already taken")
                    }
                    else {
                        reject("There was an error creating the user: " + err)
                    }
                })
            }).catch((err) => {
                console.log(err); // Show any errors that occurred during the process
                reject("There was an error encrypting the password");
            })
        }
    })
}

// checkUser(userData)
//
module.exports.checkUser = (userData) => {
    return new Promise((resolve, reject) => {
        User.find({ userName: userData.userName })
            .exec().then((users) => {
                // converting the mongoose documents to plain javascript object
                users = users.map(value => value.toObject());


                if (!Array.isArray(users) || users.length === 0) {
                    let user = userData.userName;
                    reject("Unable to find user: " + user);
                }
                else {
                    bcrypt.compare(userData.password, users[0].password).then((result) => {
                        if (result === true) {

                            // step 1
                            //
                            users[0].loginHistory.push({
                                dateTime: (new Date()).toString(),
                                userAgent: userData.userAgent
                            })

                            // step 2
                            //
                            User.updateOne(
                                { userName: users[0].userName },
                                { $set: { loginHistory: users[0].loginHistory } }
                            ).exec().then(() => {
                                resolve(users[0]);
                            }).catch((err) => {
                                reject("There was an error verifying the user: " + err);
                            })
                        }
                        else {
                            let userName = userData.userName;
                            reject("Incorrect Password for user: " + userName);
                        }
                    })
                }
            }).catch((err) => {
                let user = userData.userName;
                reject("unable to find user: " + user);
            })
    })
}