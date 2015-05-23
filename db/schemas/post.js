var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var postSchema = new Schema({
  author: String,
  body: String,
  createdDate: { type: Date, default: Date.now },
  repostedFrom: String
});

module.exports = postSchema;
