var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');
var logger = require('nlogger').logger(module);

var userSchema = new Schema({
  id: {type: String, unique: true},
  name: String,
  email: String,
  photo: String,
  following: [{type: String, default: []}],
  password: String
});

userSchema.methods.toClient = function(loggedInUser) {
  var user = {
    id: this.id,
    name: this.name,
    photo: this.photo,
    followedByCurrentUser: false
  }
  if (loggedInUser){
    logger.info('toClient() logged in:', loggedInUser);
    var following = loggedInUser.following || [];
    if (following.indexOf(this.id) !== -1) {
      logger.info('ToClient() following:', following);
      user.followedByCurrentUser = true;
    }
  }
  return user;
}

userSchema.statics.encryptPassword = function(password, done) {
    bcrypt.hash(password, 10, function(err, hash) {
      return done(err, hash);
    });
}

userSchema.statics.createUser = function(user, done) {
  var User = this.model('User');
  User.encryptPassword(user.meta.password, function(err, hash){
    if (err) {
      return done(err);
    }
    user.password = hash;
    User.create(user, done);
  });
}

userSchema.methods.follow = function(userId, done) {
  this.update({$addToSet: {following: userId}}, function(err, user){
    return done(err, user);
  });
}

userSchema.methods.unfollow = function(userId, done) {
  this.update({$pull: {following: userId}}, done);
}


userSchema.methods.checkPassword = function(password, done) {
  bcrypt.compare(password, this.password, done);
}

module.exports = userSchema;
