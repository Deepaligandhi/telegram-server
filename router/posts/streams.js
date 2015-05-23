var logger = require('nlogger').logger(module)
  , conn = require('./../../db/index')
  , ensureAuthenticated = require('./../../middleware/ensureAuthenticated')
  , passport = require('./../../authentication/index')
  , async = require('async')
  , Post = conn.model('Post')
  , User = conn.model('User');

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
        var reposts = posts.map(function(post){
          return post.repostedFrom;
        })
        Post.find({_id: {$in: reposts}}, function(err, reposts){
          reposts.forEach(function(repost){
              posts.push(repost);
          });
          logger.info("Posts found: ", posts);
          return done(err, posts);
        });

      });
    },
    function getUsers(posts, done){
      var authors = [];
      posts.forEach(function(post){
        authors.push(post.author);
      });
      logger.info("Post author query: ", authors);
      User.find({id: {$in: authors}}, function(err, users){
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
