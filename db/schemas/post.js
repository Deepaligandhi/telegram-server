var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var postSchema = new Schema({
  author: String,
  body: String,
  createdDate: { type: Date, default: Date.now },
  repostedFrom: String
});

module.exports = postSchema;
