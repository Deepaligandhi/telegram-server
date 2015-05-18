var logger = require('nlogger').logger(module);
var ensureAuthenticated = require('./../../middleware/ensureAuthenticated');
var passport = require('./../../authentication/index');
var conn = require('./../../db/index');
var sendEmail = require('./../../email/sendEmail');
var User = conn.model('User');
var account = module.exports;

account.signUpUser = function (req, res) {
  User.createUser(req.body.user, function(err, user){
  if(err) {
      if(err.code === 11000) {
        logger.error('This user is already registered');
        return res.status(404).send('This user is already registered');
      }
      return res.sendStatus(500);
    }
    req.logIn(user, function(err) {
      if (err) {
        logger.error('Login error: ' + err);
        return res.status(500).end();
      }
      logger.info('Logged in user: ' + req.body.user.id);
      logger.info('Session user: ' + req.session.passport.user);
      res.send({ user: user.toClient()});
    });
  });
}

account.loginUser = function (req, res) {
  passport.authenticate('local', function(err, user, info) {
    logger.info('passport authenticate called for user ' + user);
    if (err) {
      logger.error('Authentication error: ' + err);
      return res.status(500).end();
    }
    if (!user) {
      logger.error('Invalid login credentials for user: ' + req.body.user.id);
      return res.status(404).send('Invalid username/password!');
    }
    req.logIn(user, function(err) {
      if (err) {
        logger.error('Login error: ' + err);
        return res.status(500).end();
      }
      logger.info('Logged in user: ' + req.body.user.id);
      logger.info('Session user: ' + req.session.passport.user);
      return res.send({ user: user.toClient()});
    });
  })(req, res);
}

account.resetPassword = function (req, res) {
  var email = req.body.user.email;
  logger.info('Call reset password for: ', email);
  User.resetPassword(email, function (err, user, plainTextPassword){
    if (err) {
      logger.error(err);
      return res.sendStatus(500);
    }
    var username = user.name;
    sendEmail.sendPasswordReset(email, username, plainTextPassword, function(err, body) {
      if (body) {
        logger.info("Sent email");
        return res.send({users: []});
      }
      if (err) {
        logger.info("Error sending email ", err);
        return res.sendStatus(500);
      }
    });
  });
}

account.userAuthenticated = function(req, res){
  if (req.isAuthenticated()){
    return res.send({users: [req.user.toClient()]});
  }
  return res.send({users: []});
}
