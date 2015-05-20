var express = require('express');
var app = express();
var logger = require('nlogger').logger(module);

require('./middleware')(app);

// Route implementation
require('./router/index')(app);

var server = app.listen(3000, function() {
  logger.info('Listening on port %d', server.address().port);
});
