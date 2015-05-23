var config = require("./../config")
  , apiKey = config.get("mailgun:api_key")
  , domain = config.get("mailgun:domain")
  , mailgunFrom = config.get("mailgun:from")
  , mailgun = require('mailgun-js')({apiKey: apiKey, domain: domain})
  , logger = require('nlogger').logger(module)
  , fs = require('fs')
  , handlebars = require('handlebars')
  , templatePath = 'email/emailTemplate.hbs';

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
