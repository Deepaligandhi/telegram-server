var logger = require('nlogger').logger(module);
var ensureAuthenticated = require('./../../middleware/ensureAuthenticated');
var passport = require('./../../authentication/index');
var conn = require('./../../db/index');
//var express = require('express');
var bcrypt = require('bcrypt');
var md5 = require('MD5');
var sendEmail = require('./../../email/sendEmail');
var generatePassword = require('password-generator');
var User = conn.model('User');
var account = module.exports;

account.signUpUser = function (req, res) {
  User.findOne({id: req.body.user.id}, function(err, userFound) {
    if (err) {
      logger.error(err);
      return res.sendStatus(500);
    }
    if (userFound) {
      logger.error('This user is already registered');
      return res.status(404).send('This user is already registered');
    }
    else {
      User.createUser(req.body.user, function(err, user){
        if(err) {
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
  });
}

account.loginUser = function (req, res) {
  passport.authenticate('local', function(err, user, info) {
    logger.info('passport authenticate called for user ' + user);
    if (err) {
      logger.error('Authentication error: ' + err);
      return res.status(500).end(); }
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
    var newPass = generatePassword();
    var newPassMD5 = md5(newPass);
    var newPassBcrypt = null;
    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(newPassMD5, salt, function(err, hash) {
        if(err){
          logger.error('Bcrypt error: ', err);
          return res.sendStatus(500);
        }
        newPassBcrypt = hash;
        logger.info('encrypted password: ', newPassBcrypt);
        var query = {email: email};
        var update = {password: hash};
        var options = {new: true};
        User.findOneAndUpdate(query, update, options, function (err, userFound) {
          if (err) {
            logger.error(err);
            return res.sendStatus(500);
          }
          if (userFound) {
            logger.info('User found for email: ', email);
            var username = userFound.name;
            sendEmail.sendPasswordReset(email, username, newPass, function(err, body) {
              if (body) {
                logger.info("Sent email");
                return res.send({users: []});
              }
              if (err) {
                logger.info("Error sending email ", err);
                return res.sendStatus(500);
              }
            });
          }
          else {
            logger.error('No user registered with this email address');
            return res.status(404).send('No user registered with this email address');
          }
        });
      });
    });
  }

  account.userAuthenticated = function(req, res){
    if (req.isAuthenticated()){
      return res.send({users: [req.user.toClient()]});
    }
    else {
      return res.send({users: []});
    }
  }
