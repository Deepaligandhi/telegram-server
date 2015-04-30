var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var logger = require('nlogger').logger(module);
var mongoose = require('./../db');
var session = require('express-session');
var User = mongoose.model('User');

passport.use(new LocalStrategy({
  usernameField: 'user[id]',
  passwordField: 'user[meta][password]'
},
function(username, password, done) {
  logger.info('Localstrategy', username, password);
  User.findOne({id: username}, function (err, user, info) {
    console.log(err, user);
    if (err) {
      logger.info('authentication error: ' + err);
      return done(err);
    }
    if (!user) { return done(null, false, "User not found"); }
    logger.info('user: ' + user);
    if (user.password !== password) { return done(null, false, "Password does not match"); }
    return done(null, user);
  });
}
));

passport.serializeUser(function(user, done) {
  logger.info('serialize user ' + user.id );
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findOne({id: id}, function(err, user) {
    logger.info('deserialize user ' + id);
    done(err, user);
  });
});

module.exports = passport;
