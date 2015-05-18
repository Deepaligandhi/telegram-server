var logger = require('nlogger').logger(module);
var conn = require('./../../db/index');
var ensureAuthenticated = require('./../../middleware/ensureAuthenticated');
var passport = require('./../../authentication/index');
var async = require('async');
var Post = conn.model('Post');
var User = conn.model('User');

var streams = module.exports;

streams.fetchDashboardPosts = function(req, res) {
  logger.info('All posts');
  logger.info('User session: ' + req.user.id);
  var dashboardUsers = req.user.following;
  dashboardUsers.push(req.user.id);
  async.waterfall([
    function getPosts(done){
      Post.find({author: {$in: dashboardUsers}}, function(err, posts){
        if (err) {
          logger.error("Error loading posts", err);
          return res.sendStatus(500);
        }
        logger.info("Posts found: ", posts);
        return done(err, posts);
      });
    },
    function getUsers(posts, done){
      User.find({id: {$in: dashboardUsers}}, function(err, users){
        if (err) {
          logger.error("Error loading users", err);
          return res.sendStatus(500);
        }
        var userList = users.map(function(user) {
          return user.toClient(req.user);
        });
        logger.info("Post Users: ", userList);
        var result = {
          posts: posts,
          users: userList
        }
        return done(err, result);
      });
  }],
    function (err, result) {
    if (err) {
      return res.sendStatus(500);
    }
    res.send(result);
    logger.info("Dashboard posts loaded");
  });
}

streams.fetchAuthorPosts = function(req, res) {
  var authorPosts= [];
  Post.find({author: req.query.author}, function(err, posts){
    if (err) {
      logger.error("Could not find posts for author ", req.query.author)
      return res.sendStatus(500);
    }
    res.send({
      posts: posts
    });
  });

}
