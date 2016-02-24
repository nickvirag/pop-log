var express = require('express');
var passport = require('passport');
var router = express.Router();

var app = express();

var mongoose = require('mongoose');
mongoose.set('debug', true);

var Organization = require('../models/organization.js');
var SemesterContainer = require('../models/semestercontainer.js');

var prefs = require('../helpers/prefs.js');
var builder = require('../helpers/builder.js');

exports.get = function(req, res) {
  prefs.broadcastEmailVerified(req.user.organization, function(err, canSendEmails) {
    Organization.findById(req.user.organization, function(err, organization) {
      if (!err && organization) {
        builder.arrayToObjects(SemesterContainer, organization.semesterContainers, function(err, semesterContainers) {
          var currentYear = prefs.getCurrentYear();
          res.render('admin', {
            user: req.user,
            canSendEmails: canSendEmails,
            currentYear: currentYear,
            semesterContainers: semesterContainers,
            organization: organization
          });
        });
      } else {
        res.send('error');
      }
    });
  });
};
