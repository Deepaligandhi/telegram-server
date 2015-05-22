//Define schema and model
var mongoose = require('mongoose')
  , userSchema = require('./schemas/user')
  , postSchema = require('./schemas/post')
  , config = require("../config")
  , dbPath = "mongodb://" + config.get("database:host") + "/" + config.get("database:name");

mongoose.connect(dbPath);
mongoose.model('User', userSchema);
mongoose.model('Post', postSchema);

module.exports = mongoose.connection;
