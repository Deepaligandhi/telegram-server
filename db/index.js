//Define schema and model
var mongoose = require('mongoose');
var userSchema = require('./schemas/user');
var postSchema = require('./schemas/post');

mongoose.connect('mongodb://localhost/telegram');
mongoose.model('User', userSchema);
mongoose.model('Post', postSchema);

module.exports = mongoose.connection;
