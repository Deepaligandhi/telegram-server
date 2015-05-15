var logger = require('nlogger').logger(module);
var ensureAuthenticated = require('./../../middleware/ensureAuthenticated');
var passport = require('./../../authentication/index');
var conn = require('./../../db/index');
var express = require('express');
var postsRouter = express.Router();
var streams = require('./streams');
var Post = conn.model('Post');

postsRouter.get('/', function(req, res) {
  if (req.query.dashboard){
    return streams.fetchDashboardPosts(req, res);
  };
  if (req.query.author) {
    return streams.fetchAuthorPosts(req, res);
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
      Post.createPost(post, function(err, post){
        if (err) {
          logger.error("Error creating post: ", post);
          return res.sendStatus(500);
        }

        logger.info('New post created: ', post);
        res.send({
          post: post
        });
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
