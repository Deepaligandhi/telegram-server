var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');
var logger = require('nlogger').logger(module);
var md5 = require('MD5');
var generatePassword = require('password-generator');

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

userSchema.statics.resetPassword = function(email, done) {
  var User = this.model('User');
  var newPass = generatePassword();
  var newPassMD5 = md5(newPass);
  User.encryptPassword(newPassMD5, function (err, hash){
    if (err) {
      return done(err);
    }
    var query = {email: email};
    var update = {password: hash};
    var options = {new: true};
    User.findOneAndUpdate(query, update, options, function (err, user) {
      if (err) {
        logger.error(err);
        return res.sendStatus(500);
      }
      logger.info('User found for email: ', email);
      return done(err, user, newPass);
    });

  });
}

userSchema.statics.getFriends = function(user, done){
  var User = this.model('User');
  User.findOne({id: user}, function (err, user){
      if (err) {
        res.sendStatus(500);
      }
      User.find({id: {$in: user.following}}, function(err, users){
        if (err) {
          res.sendStatus(500);
        }
        return done(err, users);
      });
  });
}

userSchema.statics.getFollowers = function(user, done){
  var User = this.model('User');
  User.find({following: user}, function(err, users){
      return done(err, users);
  });
}

userSchema.methods.follow = function(userId, done) {
  this.update({$addToSet: {following: userId}}, done);
}

userSchema.methods.unfollow = function(userId, done) {
  this.update({$pull: {following: userId}}, done);
}


userSchema.methods.checkPassword = function(password, done) {
  bcrypt.compare(password, this.password, done);
}

module.exports = userSchema;
