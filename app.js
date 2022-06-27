const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const app = express();
const port = 5000;

// Mongoose Setup
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

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
  });

// '/login'
// GET: View page
app.route("/login")
  .get(function(req, res) {
    res.render("login");
  });
