var logger = require('nlogger').logger(module)
  , conn = require('./../../db/index')
  , User = conn.model('User');

var graph = module.exports;

graph.findFollowing = function(req, res){
  logger.info("following for profile: ", req.query.following);
  User.getFriends(req.query.following, function(err, users) {
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
}

graph.findFollowers = function(req, res){
  User.getFollowers(req.query.follower, function(err, users){
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
      logger.error(err.message);
      return res.sendStatus(500);
    }
    var user = {
      id: req.params.id,
      followedByCurrentUser: true
    }
    res.send({
      user: user
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
      logger.error(err.message);
      return res.sendStatus(500);
    }
    var user = {
      id: req.params.id,
      followedByCurrentUser: false
    }
    res.send({
      user: user
    });
    logger.info('Unfollowed User ' + userId);
  });
}
