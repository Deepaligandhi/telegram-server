var express = require('express');
var router = express.Router();
var logger = require('nlogger').logger(module);

router.get('/', function(req, res) {
  req.logout();
  return res.status(204).end();
});

module.exports = router;
