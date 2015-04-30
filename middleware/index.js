var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');

function setupMiddleware(app) {
  app.use(cookieParser());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(session({secret: 'keyboard cat', resave:false, saveUninitialized: true}));
  app.use(passport.initialize());
  app.use(passport.session());
}

module.exports = setupMiddleware;
