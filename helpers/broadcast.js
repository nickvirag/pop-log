var express = require('express');
var router = express.Router();
var app = express();

var Organization = require('../models/organization');

var builder = require('./builder.js');
var prefs = require('./prefs');

var nodemailer = require('nodemailer');
var async = require('async');

exports.getTransporter = function(email, password) {
  return nodemailer.createTransport('SMTP', {
    service: 'Gmail',
    auth: {
      user: email,
      pass: password
    }
  });
};

exports.testMail = function(organizationId, email, name, response) {
  Organization.findById(organizationId, function(err, organization) {
    if (!err && organization) {
      var transporter = exports.getTransporter(organization.emailUsername, organization.emailPassword);
      var emailText = 'Hello ' + name + '! This is a broadcast test.';
      var mailOptions = {
        from: 'No Reply - ' + organization.displayName + ' <' + organization.emailUsername + '>',
        to: email,
        subject: prefs.getSiteTitle() + ' Test Email',
        text: emailText,
        html: emailText
      };
      transporter.sendMail(mailOptions, function(err, resp) {
        response(err, resp);
      });
    } else {
      res.send('error');
    }
  });
};

exports.inviteMail = function(organizationId, inviter, emails, callback) {
  Organization.findById(organizationId, function(err, organization) {
    if (!err && organization) {
      var transporter = exports.getTransporter(organization.emailUsername, organization.emailPassword);
      var calls = [];
      var subject = inviter + ' has invited you to join ' + organization.displayName + ' on ' + prefs.getSiteTitle() + '!';
      var sender = 'No Reply - ' + organization.displayName + ' <' + organization.emailUsername + '>';
      var siteTitle = prefs.getSiteTitle();
      emails.forEach(function(email) {
        var url = prefs.getWebURL() + '/login';
        var emailText = 'Hello! ' + inviter + ' has invited you to join ' + organization.displayName + ' on ' + siteTitle + '.<br>'
          + 'Log in today with your email account <b>' +  email + '</b> at <a href="' + url + '">' + url + '</a>.<br><br><br>'
          + 'This is an automated email and responses to this address will not be reviewed by a human. For help or support, contact your organization\'s administrator.';
        var mailOptions = {
          from: sender,
          to: email,
          subject: subject,
          text: emailText,
          html: emailText
        };
        calls.push(function(response) {
          transporter.sendMail(mailOptions, function(error, resp) {
            response(error, resp);
          });
        });
      });
      async.series(calls, function(error, mailResponse) {
        callback(error, mailResponse);
      });
    } else {
      callback(err, {});
    }
  });
};
