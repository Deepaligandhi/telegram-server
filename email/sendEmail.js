var api_key = 'key-febe0388557136fb4faf55ce9c98ec2c';
var domain = 'sandbox76c83801599445239c982511f8776837.mailgun.org';
var mailgunFrom = 'postmaster@sandbox76c83801599445239c982511f8776837.mailgun.org';
var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});
var logger = require('nlogger').logger(module);
var fs = require('fs');
var handlebars = require('handlebars');
var templatePath = 'email/emailTemplate.hbs';

sendEmail = exports;

sendEmail.sendPasswordReset = function(email, password, done) {
  var content = fs.readFileSync(templatePath, 'utf-8');
  var body = handlebars.compile(content);

  var message = {
    from: mailgunFrom,
    to: email,
    subject: 'Password Reset',
    html: body({password: password})
  };

  mailgun.messages().send(message, function (err, body) {
    if(err) {
      logger.info(err);
      return done(err);
    }
    logger.info(body);
    return done(null, body);
  });
}
