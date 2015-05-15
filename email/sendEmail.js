var config = require("./../config");
var apiKey = config.get("mailgun:api_key");
var domain = config.get("mailgun:domain");
var mailgunFrom = config.get("mailgun:from");
var mailgun = require('mailgun-js')({apiKey: apiKey, domain: domain});
var logger = require('nlogger').logger(module);
var fs = require('fs');
var handlebars = require('handlebars');
var templatePath = 'email/emailTemplate.hbs';

var sendEmail = exports;
sendEmail.sendPasswordReset = function(email, username, password, done) {
  fs.readFile(templatePath, 'utf-8', function(err, content){
    if (err) {
      return done(err);
    }
    var body = handlebars.compile(content);
    var message = {
      from: mailgunFrom,
      to: email,
      subject: 'Password Reset',
      html: body({username: username, password: password})
    };
    mailgun.messages().send(message, function (err, body) {
      if(err) {
        logger.info(err);
        return done(err);
      }
      logger.info(body);
      return done(null, body);
    });

  });


}
