var logger = require('nlogger').logger(module);
var ensureAuthenticated = require('./../middleware/ensureAuthenticated');
var passport = require('./../authentication/index');
var conn = require('./../db/index');
var express = require('express');
var bcrypt = require('bcrypt');
var md5 = require('MD5');
var sendEmail = require('./../email/sendEmail');

var usersRouter = express.Router();

var User = conn.model('User');
usersRouter.get('/:id', ensureAuthenticated, function(req, res) {
  User.findOne({id: req.params.id}, function(err, userFound) {
    if (err) {
      res.status(404).send('User ' + req.param.id + ' not found!');
    }
    if(userFound) {
      res.send({
        user: userFound.toClient(req.params.id)
      });
    }
  });
});


usersRouter.post('/', function(req, res, next) {
  if (req.body.user.meta.operation === 'signup'){
    signUpUser(req, res);
  };
  if (req.body.user.meta.operation === 'login') {
    loginUser (req, res);
  }
  if(req.body.user.meta.operation === 'reset') {
    resetPassword(req, res);
  }
});

usersRouter.get('/', function(req, res) {
  if (req.query.isAuthenticated){
    {
      if (req.isAuthenticated()){
        return res.send({users: [req.user.toClient()]});
      }
      else {
        return res.send({users: []});
      }
    }
  }
  if(req.query.following) {
    User.findOne({id: req.query.user}, function (err, user){
        if (err) {
          res.sendStatus(500);
        }
        User.find({id: {$in: user.following}}, function(err, users){
          if (err) {
            res.sendStatus(500);
          }
          var userList = [];
          users.forEach(function(user){
            var emberUser = user.toClient(req.user);
            userList.push(emberUser);
          })
          logger.info('Users following this user: ', userList);
          res.send({
            users: userList
          });
        });
    });
  }
  if (req.query.follower) {
      User.find({following: req.query.user}, function(err, users){
          if (err) {
            res.sendStatus(500);
          }
          var userList = [];
          users.forEach(function(user){
            var emberUser = user.toClient(req.user);
            userList.push(emberUser);
          })
          logger.info('Followers: ', userList);
          res.send({
            users: userList
          });
      });
  }
});


usersRouter.put('/:id', function(req, res) {
  var userId = req.params.id;
  logger.info(userId);
  if (req.body.user.meta.operation === 'followUser'){
    User.follow(req.user, userId, function(err, userFollowed){
      if (err) {
        res.sendStatus(500);
      }
      logger.info(userFollowed);
      res.send({
        user: userFollowed.toClient(userFollowed)
      });
      logger.info('Followed User ' + userId);
    });
  }
  if (req.body.user.meta.operation === 'unfollowUser'){
    User.unfollow(req.user, userId, function(err, userUnFollowed){
      if (err) {
        res.sendStatus(500);
      }
      res.send({
        user: userUnFollowed.toClient()
      });
      logger.info('Unfollowed User ' + userId);
    });
  }
});


function signUpUser (req, res) {
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
            res.send({ user: user});
          });
      });

    }
  });
}

function loginUser (req, res) {
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
        return res.send({ user: user});
      });
    })(req, res);
  }

function resetPassword (req, res) {
    var email = req.body.user.email;
    var newPass = randomPassword();
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
            sendEmail.sendPasswordReset(email, newPass, function(err, body) {
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

function randomPassword() {
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
        var string_length = 8;
        var randomstring = '';
        for (var i=0; i<string_length; i++) {
            var rnum = Math.floor(Math.random() * chars.length);
            randomstring += chars.substring(rnum,rnum+1);
        }
    return randomstring;
}

module.exports = usersRouter;
