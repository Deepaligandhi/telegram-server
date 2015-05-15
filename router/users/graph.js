var logger = require('nlogger').logger(module);
var conn = require('./../../db/index');
var User = conn.model('User');

var graph = module.exports;

graph.findFollowing = function(req, res){
    User.findOne({id: req.query.user}, function (err, user){
        if (err) {
          res.sendStatus(500);
        }
        User.find({id: {$in: user.following}}, function(err, users){
          if (err) {
            res.sendStatus(500);
          }
          var userList = users.map(function(user) {
            return user.toClient(req.user);
          });
          logger.info('Users following this user: ', userList);
          res.send({
            users: userList
          });
        });
    });
  }

graph.findFollowers = function(req, res){
    User.find({following: req.query.user}, function(err, users){
        if (err) {
          res.sendStatus(500);
        }
        var userList = users.map(function(user) {
          return user.toClient(req.user);
        });
        logger.info('Followers: ', userList);
        res.send({
          users: userList
        });
    });
  }

graph.followUser = function(req, res){
    var userId = req.params.id;
    logger.info(userId);
    var currentUser = req.user;
    currentUser.follow(userId, function(err, userFollowed){
      if (err) {
        res.sendStatus(500);
      }
      logger.info(userFollowed);
      res.send({
        user: currentUser.toClient(currentUser)
      });
      logger.info('Followed User ' + userId);
    });
  }

graph.unfollowUser = function(req, res){
    var userId = req.params.id;
    logger.info(userId);
    var currentUser = req.user;
    currentUser.unfollow(userId, function(err, userUnFollowed){
      if (err) {
        res.sendStatus(500);
      }
      res.send({
        user: currentUser.toClient()
      });
      logger.info('Unfollowed User ' + userId);
    });
  }
