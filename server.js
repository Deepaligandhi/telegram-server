
var express = require('express');
var app = express();

var logger = require('nlogger').logger(module);
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({secret: 'keyboard cat', resave:false, saveUninitialized: true}));

passport.use(new LocalStrategy({
  usernameField: 'user[id]',
  passwordField: 'user[meta][password]'
},
function(username, password, done) {
  logger.info('Localstrategy', username, password);
  User.findOne({id: username}, function (err, user, info) {
    console.log(err, user);
    if (err) {
      logger.info('authentication error: ' + err);
      return done(err);
    }
    if (!user) { return done(null, false, "User not found"); }
    logger.info('user: ' + user);
      if (user.password !== password) { return done(null, false, "Password does not match"); }
      return done(null, user);
    });
  }
));

passport.serializeUser(function(user, done) {
  logger.info('serialize user ' + user.id );
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findOne({id: id}, function(err, user) {
    logger.info('deserialize user ' + id);
    done(err, user);
  });

});

app.use(passport.initialize());
app.use(passport.session());

//Define schema and model
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/telegram');

var Schema = mongoose.Schema;

var userSchema = new Schema({
  id: {type: String, unique: true},
  name: String,
  email: String,
  photo: String,
  following: [{type: Schema.Types.ObjectId, ref: 'User'}],
  followers: [{type: Schema.Types.ObjectId, ref: 'User'}],
  password: String
});

var User = mongoose.model('User', userSchema);


// Route implementation
var usersRouter = express.Router();

function ensureAuthenticated(req, res, next){
  if (req.isAuthenticated()){
    return next();
  }
  else {
    return res.status(403).end();
  }
}

usersRouter.get('/:id', ensureAuthenticated, function(req, res) {
  User.findOne({id: req.params.id}, function(err, userFound) {
    if (err) {
      res.status(404).send('User ' + req.param.id + ' not found!');
    }
    if(userFound) {
      res.send({
        user: userFound
      });
    }
  });
});

usersRouter.post('/', function(req, res, next) {
  if (req.body.user.meta.operation === 'signup'){
    var user = {
      id: req.body.user.id,
      name: req.body.user.name,
      email: req.body.user.email,
      password: req.body.user.meta.password
    };
    User.findOne({id: req.body.user.id}, function(err, userFound) {
      if (err) {
        logger.error(err);
        return res.sendStatus(500);
      }
      if (userFound) {
        logger.error('This user is already registered');
        res.status(404).send('This user is already registered');
      }
    });
    var newUser = new User (user);
    newUser.save(function(err) {
      if (err) {
        logger.error("Error creating user: ", user);
        return res.sendStatus(500);
      }
    });
    logger.info('Signed up new user: ' + req.body.user.id);
    req.logIn(newUser, function(err) {
      if (err) {
        logger.error('Login error: ' + err);
        return res.status(500).end();
      }
      logger.info('Logged in user: ' + req.body.user.id);
      logger.info('Session user: ' + req.session.passport.user);
      res.send({ user: user});
    });
  };
  if (req.body.user.meta.operation === 'login') {
    passport.authenticate('local', function(err, user, info) {
      logger.info('passport authenticate called for user ' + user);
      if (err) {
        logger.error('Authentication error: ' + err);
        return res.status(500).end(); }
        if (!user) {
          logger.error('Invalid login credentials for user: ' + req.body.user.id);
          return res.status(404).send('Invalid username/password!');
        }
        req.logIn(user, function(err) {
          if (err) {
            logger.error('Login error: ' + err);
            return res.status(500).end();
          }
          logger.info('Logged in user: ' + req.body.user.id);
          logger.info('Session user: ' + req.session.passport.user);
          return res.send({ user: user});
        });
      })(req, res, next);
    };

  });

  usersRouter.get('/', function(req, res) {
    if (req.query.isAuthenticated){
      {
        if (req.isAuthenticated()){
          return res.send({users: [req.user]});
        }
        else {
          return res.send({users: []});
        }
      }
    }
    if(req.query.following) {
      logger.info('Users following this user');
      res.send({
        users: users
      });
    }
    else {
      logger.info('All users');
      res.send({
        users: users
      });
    }
  });

  usersRouter.put('/:id', function(req, res) {
    var userId = req.params.id;
    if (req.body.user.meta.operation === 'followUser'){
      var user = {
        id: userId,
        followedByCurrentUser: req.body.user.followedByCurrentUser
      };
      logger.info('Followed User ' + userId);
      res.send({
        user: users[userId]
      });
    };

    if (req.body.user.meta.operation === 'unfollowUser'){
      var user = {
        id: userId,
        followedByCurrentUser: false
      };
      logger.info('Unfollowed User ' + userId);
      res.send({
        user: users[userId]
      });
    };
  });



  app.use('/api/users', usersRouter);

  app.get('/api/logout', function (req, res) {
    req.logout();
    res.sendStatus(200);
  });

  var postsRouter = express.Router();
  var postId = 0;

  var posts = [
    {
      id: "p1",
      author: "dgandhi",
      body: "post 1 body"
    },
    {
      id: "p2",
      author: "varun",
      body: "post 2 body"
    },
    {
      id: "p3",
      author: "dgandhi",
      body: "post 3 body"
    },
    {
      id: "p4",
      author: "pmgandhi",
      body: "post 4 body"
    }
  ];

  postsRouter.get('/', function(req, res) {
    if (req.query.dashboard){
      logger.info('All posts');
      logger.info('User session: ' + req.user.id);
      res.send({
        posts: posts
      });
    };
    if (req.query.author) {
      var authorPosts = posts.filter(function(post) {
        return post.author === req.query.author;
      });
      logger.info('Posts for ' + req.query.author);
      res.send({
        posts: authorPosts
      });
    };
  });

  postsRouter.post('/', ensureAuthenticated, function(req, res) {
    if(req.body.post.meta.operation === 'createPost'){
      if (req.user.id === req.body.post.author) {
        postId++;
        var post = {
          id: postId,
          author: req.body.post.author,
          body: req.body.post.body,
          repostedFrom: req.body.post.repostedFrom
        };
        posts.push(post);
        logger.info('New post created: ' + postId);
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
    for (var i = 0; i < posts.length; i++) {
      if (posts[i].id === req.params.id) {
        posts.splice(posts[i].id, 1);
      }
    }
    logger.info('Post deleted for id: ' + req.params.id);
    res.status(204).end();
  });

  app.use('/api/posts', postsRouter);

  var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
  });
