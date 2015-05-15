var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var postSchema = new Schema({
  author: String,
  body: String,
  createdDate: { type: Date, default: Date.now },
  repostedFrom: String
});


postSchema.statics.createPost = function(post, done) {
  var Post = this.model('Post');

    Post.create(post, done);

}
module.exports = postSchema;
