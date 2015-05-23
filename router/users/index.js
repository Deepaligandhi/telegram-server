var logger = require('nlogger').logger(module)
  , ensureAuthenticated = require('./../../middleware/ensureAuthenticated')
  , express = require('express')
  , usersRouter = express.Router()
  , account = require('./account')
  , graph = require('./graph')
  , conn = require('./../../db/index')
  , User = conn.model('User');

usersRouter.get('/:id', ensureAuthenticated, function(req, res) {
  User.findOne({id: req.params.id}, function(err, userFound) {
    if (err) {
      res.status(404).send('User ' + req.param.id + ' not found!');
    }
    if(userFound) {
      res.send({
        user: userFound.toClient(req.user)
      });
    }
  });
});

usersRouter.post('/', function(req, res, next) {
  logger.info("Request ", req.body.user.meta.operation);
  var operation = req.body.user.meta.operation;
  switch(operation) {
    case 'signup': return account.signUpUser(req, res);
    case 'login': return account.loginUser (req, res);
    case 'reset': return account.resetPassword(req, res);
    case 'logout': return account.logout(req, res);
  }
});

usersRouter.get('/', function(req, res) {
  if (req.query.isAuthenticated){
    return account.userAuthenticated(req, res);
  }
  if(req.query.following) {
    logger.info("Following: ", req.query.following);
    return graph.findFollowing(req, res);
  }
  if (req.query.follower) {
      return graph.findFollowers(req, res);
  }
});


usersRouter.put('/:id', function(req, res) {

  var operation = req.body.user.meta.operation;
  switch(operation){
    case 'followUser': return graph.followUser(req, res);
    case 'unfollowUser': return graph.unfollowUser(req, res);
  }
});

module.exports = usersRouter;
