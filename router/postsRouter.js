var logger = require('nlogger').logger(module);
var ensureAuthenticated = require('./../middleware/ensureAuthenticated');
var passport = require('./../authentication/index');
var conn = require('./../db/index');
var express = require('express');
var postsRouter = express.Router();

var Post = conn.model('Post');
var User = conn.model('User');

postsRouter.get('/', function(req, res) {
  if (req.query.dashboard){
    fetchDashboardPosts(req, res);
  };
  if (req.query.author) {
    fetchAuthorPosts(req, res);
  };
});

postsRouter.post('/', ensureAuthenticated, function(req, res) {
  if(req.body.post.meta.operation === 'createPost'){
    if (req.user.id === req.body.post.author) {
      var post = {
        author: req.body.post.author,
        body: req.body.post.body,
        repostedFrom: req.body.post.repostedFrom
      };
      var newPost = new Post (post);
      newPost.save(function(err){
        if (err) {
          logger.error("Error creating post: ", post);
          return res.sendStatus(500);
        }
      });
      logger.info('New post created: ', post);
      res.send({
        post: post
      });
    }
    else {
      return res.status(401).end();
    }
  }
});

postsRouter.delete('/:id', function(req, res) {
  Post.findByIdAndRemove(req.params.id, function(err) {
    if (err) {
      logger.error("Error deleting post with id: ", req.param.id);
      return res.sendStatus(404);
    }
  });
  logger.info('Post deleted for id: ' + req.param.id);
  res.status(204).end();
});

function fetchDashboardPosts(req, res) {
  var allPosts = [];
  logger.info('All posts');
  logger.info('User session: ' + req.user.id);
  Post.find({}, function(err, posts){
    if (err) {
      logger.error("Error loading posts", err);
      return res.sendStatus(500);
    }
    var authorList = [];
    posts.forEach(function(post){
      authorList.push(post.author);
    });
    User.find({id: {$in: authorList}}, function(err, users){
      if (err) {
        logger.error("Error loading users", err);
        return res.sendStatus(500);
      }
      var userList = [];
      users.forEach(function(user){
        var emberUser = user.toClient();
        userList.push(emberUser);
      });
      logger.info("Post Users: ", userList);
      res.send({
        posts: posts,
        users: userList
      });
    });
  });
}

function fetchAuthorPosts(req, res) {
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

module.exports = postsRouter;
