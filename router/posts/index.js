var logger = require('nlogger').logger(module)
  , ensureAuthenticated = require('./../../middleware/ensureAuthenticated')
  , passport = require('./../../authentication/index')
  , conn = require('./../../db/index')
  , express = require('express')
  , postsRouter = express.Router()
  , streams = require('./streams')
  , Post = conn.model('Post');

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
      Post.create(req.body.post, function(err, post){
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
    logger.info('Post deleted for id: ' + req.param.id);
    res.status(204).end();
  });
});

module.exports = postsRouter;
