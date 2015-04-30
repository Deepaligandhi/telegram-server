var logger = require('nlogger').logger(module);
var ensureAuthenticated = require('./../middleware/ensureAuthenticated');
var passport = require('./../authentication/index');
var mongoose = require('./../db');
var express = require('express');

var usersRouter = express.Router();

var User = mongoose.model('User');
console.log("user router");
usersRouter.get('/:id', ensureAuthenticated, function(req, res) {
  User.findOne({id: req.params.id}, function(err, userFound) {
    if (err) {
      res.status(404).send('User ' + req.param.id + ' not found!');
    }
    if(userFound) {
      res.send({
        user: userFound
      });
    }
  });
});

usersRouter.post('/', function(req, res, next) {
  if (req.body.user.meta.operation === 'signup'){
    var user = {
      id: req.body.user.id,
      name: req.body.user.name,
      email: req.body.user.email,
      password: req.body.user.meta.password
    };
    User.findOne({id: req.body.user.id}, function(err, userFound) {
      if (err) {
        logger.error(err);
        return res.sendStatus(500);
      }
      if (userFound) {
        logger.error('This user is already registered');
        res.status(404).send('This user is already registered');
      }
    });
    var newUser = new User (user);
    newUser.save(function(err) {
      if (err) {
        logger.error("Error creating user: ", user);
        return res.sendStatus(500);
      }
    });
    logger.info('Signed up new user: ' + req.body.user.id);
    req.logIn(newUser, function(err) {
      if (err) {
        logger.error('Login error: ' + err);
        return res.status(500).end();
      }
      logger.info('Logged in user: ' + req.body.user.id);
      logger.info('Session user: ' + req.session.passport.user);
      res.send({ user: user});
    });
  };
  if (req.body.user.meta.operation === 'login') {
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
      })(req, res, next);
    };

  });

  usersRouter.get('/', function(req, res) {
    if (req.query.isAuthenticated){
      {
        if (req.isAuthenticated()){
          return res.send({users: [req.user]});
        }
        else {
          return res.send({users: []});
        }
      }
    }
    if(req.query.following) {
      logger.info('Users following this user');
      res.send({
        users: users
      });
    }
    else {
      logger.info('All users');
      res.send({
        users: users
      });
    }
  });


  usersRouter.put('/:id', function(req, res) {
    var userId = req.params.id;
    if (req.body.user.meta.operation === 'followUser'){
      var user = {
        id: userId,
        followedByCurrentUser: req.body.user.followedByCurrentUser
      };
      logger.info('Followed User ' + userId);
      res.send({
        user: users[userId]
      });
    };

    if (req.body.user.meta.operation === 'unfollowUser'){
      var user = {
        id: userId,
        followedByCurrentUser: false
      };
      logger.info('Unfollowed User ' + userId);
      res.send({
        user: users[userId]
      });
    };
  });


  module.exports = usersRouter;
