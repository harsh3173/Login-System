const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
const bodyParser = require("body-parser");
const passportLocalMongoose = require("passport-local-mongoose");
const path = require('path');
const favicon = require('static-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const LocalStrategy = require('passport-local').Strategy;
const async = require('async');
const crypto = require('crypto');
var _ = require('lodash');
const app = express();

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

// Passport Config
require(__dirname+"/passport")(passport);

// DB Config
const db = require(__dirname+"/keys").mongoURI;

// Connect to MongoDB
mongoose.connect(dbPassword,{ useNewUrlParser: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// EJS
app.use(express.static("public"));
app.set('view engine', 'ejs');

// Express body parser
app.use(express.urlencoded({ extended: true }));

// Express session
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
}))

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global constiables
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// Routes
app.use('/', require(__dirname +'/index.js'));
app.use('/users', require(__dirname +'/users.js'));
app.set( 'port', ( process.env.PORT || 3000 ));

// Start node server
app.listen( app.get( 'port' ), function() {
  console.log( 'Node server is running on port ' + app.get( 'port' ));
  });
