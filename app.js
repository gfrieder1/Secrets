require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;

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
});

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
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
      const newUser = new User({
        username: req.body.username,
        passwordHash: hash
      });

      newUser.save(function(err) {
        if (!err) res.render("secrets");
        else {
          console.log(err);
          res.send(err);
        }
      });
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

    User.findOne({username: username}, function(err, foundUser) {
      console.log(foundUser);
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          bcrypt.compare(req.body.password, foundUser.passwordHash).then(function(result) {
            if (result) res.render("secrets");
            else res.send("<script>alert(\"Invalid Username and/or Password\"); window.location.href = \"/login\"; </script>");
          });
        }
        else {
          res.send("<script>alert(\"Invalid Username and/or Password\"); window.location.href = \"/login\"; </script>");
        }
      }
    });
  });
