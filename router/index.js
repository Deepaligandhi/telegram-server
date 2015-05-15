var app = require('../server');

module.exports = function (app) {
  app.use('/api/users', require('./users'));
  app.use('/api/posts', require('./posts'));
}
