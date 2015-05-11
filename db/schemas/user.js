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
    photo: this.photo
  }
  if (loggedInUser){
    logger.info('toClient() logged in:', loggedInUser);
    var following = loggedInUser.following;
    if (following && following.indexOf(this.id) !== -1) {
      logger.info('ToClient() following:', following);
      user.followedByCurrentUser = true;
    }
  }
  else {
    user.followedByCurrentUser = false;
  }
  return user;
}

userSchema.statics.encryptPassword = function(password, done) {
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(password, salt, function(err, hash) {
      return done(err, hash);
    });
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

userSchema.statics.follow = function(loggedInUser, followUser, done) {
  var User = this.model('User');
  User.findOneAndUpdate({id: loggedInUser.id}, {$addToSet: {following: followUser}}, function(err, user){
    return done(err, user);
  });
}

userSchema.statics.unfollow = function(loggedInUser, unfollowUser, done) {
  var User = this.model('User');
  User.findOneAndUpdate({id: loggedInUser.id}, {$pull: {following: unfollowUser}}, function(err, user){
    return done(err, user);
  });
}


userSchema.methods.checkPassword = function(password, done) {
  bcrypt.compare(password, this.password, done);
}

module.exports = userSchema;
