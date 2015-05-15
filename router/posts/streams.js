var logger = require('nlogger').logger(module);
var conn = require('./../../db/index');
var ensureAuthenticated = require('./../../middleware/ensureAuthenticated');
var passport = require('./../../authentication/index');
var Post = conn.model('Post');
var User = conn.model('User');

var streams = module.exports;

streams.fetchDashboardPosts = function(req, res) {
  var allPosts = [];
  logger.info('All posts');
  logger.info('User session: ' + req.user.id);

  var dashboardUsers = req.user.following;
  dashboardUsers.push(req.user.id);
  User.find({id: {$in: dashboardUsers}}, function(err, users){
    if (err) {
      logger.error("Error loading users", err);
      return res.sendStatus(500);
    }
    var userList = users.map(function(user) {
      return user.toClient(req.user);
    });
    logger.info("Post Users: ", userList);
    Post.find({author: {$in: dashboardUsers}}, function(err, posts){
      if (err) {
        logger.error("Error loading posts", err);
        return res.sendStatus(500);
      }

      res.send({
        posts: posts,
        users: userList
      });
    });
  });
}

streams.fetchAuthorPosts = function(req, res) {
  var authorPosts= [];
  Post.find({author: req.query.author}, function(err, posts){
    if (err) {
      logger.error("Could not find posts for author ", req.query.author)
      res.sendStatus(500);
    }
    res.send({
      posts: posts
    });
  });

}
