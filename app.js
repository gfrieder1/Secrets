require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const findOrCreate = require("mongoose-findorcreate");
const bcrypt = require("bcrypt");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
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
  password: String,
  googleId: String
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(user, done) {
  done(null, user);
});
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:5000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


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
  });

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get("/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets
    res.redirect("/secrets");
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
