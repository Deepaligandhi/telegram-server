var app = require('../server');

module.exports = function (app) {
  app.use('/api/users', require('./usersRouter'));
  app.use('/api/posts', require('./postsRouter'));
  app.use('/api/logout', require('./logout'));
}
