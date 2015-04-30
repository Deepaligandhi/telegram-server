//Define schema and model
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/telegram');

var userSchema = require('./schemas/user');
mongoose.model('User', userSchema);

var postSchema = require('./schemas/post');
mongoose.model('Post', postSchema);

module.exports = mongoose;
