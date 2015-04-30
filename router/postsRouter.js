var logger = require('nlogger').logger(module);
var ensureAuthenticated = require('./../middleware/ensureAuthenticated');
var passport = require('./../authentication/index');
var mongoose = require('./../db');
var express = require('express');
var postsRouter = express.Router();

var Post = mongoose.model('Post');
postsRouter.get('/', function(req, res) {
  if (req.query.dashboard){
    var allPosts = [];
    logger.info('All posts');
    logger.info('User session: ' + req.user.id);
    Post.find({}, function(err, posts){
      if (err) {
        logger.error("Error loading posts");
        res.sendStatus(500);
      }
      posts.forEach(function(post){
        var eachPost = {
          id: post._id,
          author: post.author,
          body: post.body,
          repostedFrom: post.repostedFrom
        };
        allPosts.push(eachPost);
      });
      res.send({
        posts: allPosts
      });
    });
  };
  if (req.query.author) {
    var authorPosts= [];
    Post.find({author: req.query.author}, function(err, posts){
      if (err) {
        logger.error("Could not find posts for author ", req.query.author)
        res.sendStatus(500);
      }
      posts.forEach(function(post){
        var eachPost = {
          id: post._id,
          author: post.author,
          body: post.body,
          repostedFrom: post.repostedFrom
        };
        authorPosts.push(eachPost);
      });
      logger.info('Posts for ' + req.query.author);
      res.send({
        posts: authorPosts
      });
    });
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

module.exports = postsRouter;
