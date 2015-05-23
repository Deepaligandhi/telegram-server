var cookieParser = require('cookie-parser')
  , bodyParser = require('body-parser')
  , session = require('express-session')
  , MongoStore = require('connect-mongostore')(session)
  , passport = require('passport');

function setupMiddleware(app) {
  app.use(cookieParser());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(session({
    secret: 'my secret',
    resave:false,
    saveUninitialized: true,
    store: new MongoStore({'db': 'sessions'})
  }));
  app.use(passport.initialize());
  app.use(passport.session());
}

module.exports = setupMiddleware;
