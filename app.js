require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const flash = require("connect-flash");

// consider moving this to an environment variable since it's tied to security of the hash
const saltRounds = 10;

const app = express();
const port = 5000;

// App Setup
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.set("view engine", "ejs");
app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Mongoose & Passport Setup
mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true
});
const userSchema = new mongoose.Schema ({
  username: String,
  password: String
});
userSchema.plugin(passportLocalMongoose)
const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// Start Server
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
// POST: Register a new user and redirect them to the secrets page once they're authenticated
app.route("/register")
  .get(function(req, res) {
    res.render("register");
  })
  .post(function(req, res) {
    User.register({username:req.body.username}, req.body.password, function(err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        console.log("User Registered!");
        // calback is only triggered if authentication was successful
        passport.authenticate("local")(req, res, function() {
          res.redirect("/secrets");
        });
      }
    });
    // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    //   const newUser = new User({
    //     username: req.body.username,
    //     password: hash
    //   });
    //
    //   newUser.save(function(err) {
    //     if (!err) res.render("secrets");
    //     else {
    //       console.log(err);
    //       res.send(err);
    //     }
    //   });
    // });
  });

// '/login'
// GET: View page
// POST: Authenticate a user and redirect them to the secrets page
app.route("/login")
  .get(function(req, res) {
    res.render("login");
  })
  .post(passport.authenticate("local", { failureRedirect: "/loginfailure", failureFlash: true }), function(req, res) {
    res.redirect("/secrets");

    // // check if matching user credentials are found in the database
    // const username = req.body.username;
    //
    // User.findOne({username: username}, function(err, foundUser) {
    //   // console.log(foundUser);
    //   if (err) {
    //     console.log(err);
    //   } else {
    //     if (foundUser) {
    //       bcrypt.compare(req.body.password, foundUser.password).then(function(result) {
    //         if (result) res.render("secrets");
    //         else res.send("<script>alert(\"Invalid Username and/or Password\"); window.location.href = \"/login\"; </script>");
    //       });
    //     }
    //     else {
    //       res.send("<script>alert(\"Invalid Username and/or Password\"); window.location.href = \"/login\"; </script>");
    //     }
    //   }
    // });
  });

// '/logout'
// GET: View page
// POST: Authenticate a user and redirect them to the secrets page
app.route("/logout")
  .get(function(req, res) {
    req.logout(function(err) {
      if (err) {
        console.log(err);
        res.send(err);
      }
    });
    res.redirect("/");
  })

// '/loginfailure'
// GET: Display alert, then redirect to login page
app.route("/loginfailure")
  .get(function(req, res) {
    res.send("<script>alert(\"Invalid Username and/or Password\"); window.location.href = \"/login\"; </script>");
  });

// '/secrets'
// GET: View page ONLY if the user is authenticated
app.route("/secrets")
  .get(function(req, res) {
    if (req.isAuthenticated()) {
      res.render("secrets");
    } else {
      res.redirect("/login");
    }
  });
