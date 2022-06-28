require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const md5 = require("md5");

const app = express();
const port = 5000;

// Mongoose Setup
mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true
});
const userSchema = new mongoose.Schema ({
  username: String,
  passwordHash: String
});
const secret = process.env.SECRET_KEY;
const User = mongoose.model("User", userSchema);

// Server Setup
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.set("view engine", "ejs");

app.listen(port, function() {
  console.log("Server started on port " + port);
})

// '/'
// GET: View page
app.route("/")
  .get(function(req, res) {
    res.render("home");
  });

// '/register'
// GET: View page
app.route("/register")
  .get(function(req, res) {
    res.render("register");
  })
  .post(function(req, res) {
    const newUser = new User({
      username: req.body.username,
      passwordHash: md5(req.body.password)
    });

    newUser.save(function(err) {
      if (!err) res.render("secrets");
      else {
        console.log(err);
        res.send(err);
      }
    });
  });

// '/login'
// GET: View page
app.route("/login")
  .get(function(req, res) {
    res.render("login");
  })
  .post(function(req, res) {
    // check if matching user credentials are found in the database
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email: username}, function(err, foundUser) {
      if (!err) {
        if (foundUser.passwordHash === md5(password)) {
          console.log("User Login Sucessful")
          res.render("secrets");
        }
        else {
          res.send("<script>alert(\"Check Username and/or Password\"); window.location.href = \"/login\"; </script>");
          // res.redirect("/login");
        }
      }
      else {
        console.log(err);
        res.send(err);
      }
    });
  });
