var express = require('express');
var app = express();
var logger = require('nlogger').logger(module);
//var session = require('express-session');
//var passport = require('passport');
//var LocalStrategy = require('passport-local').Strategy;

//require('./db');
require('./middleware')(app);
//var ensureAuthenticated = require('./middleware/ensureAuthenticated');

// Route implementation
require('./router/index')(app);

var server = app.listen(3000, function() {
  logger.info('Listening on port %d', server.address().port);
});
