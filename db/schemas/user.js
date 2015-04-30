var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  id: {type: String, unique: true},
  name: String,
  email: String,
  photo: String,
  following: [{type: Schema.Types.ObjectId, ref: 'User'}],
  password: String
});

module.exports = userSchema;
