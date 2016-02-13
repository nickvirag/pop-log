var express = require('express');
var passport = require('passport');
var router = express.Router();

var app = express();

var prefs = require('../helpers/prefs');
var builder = require('../helpers/builder');

var Organization = require('../models/organization.js');

var mongoose = require('mongoose');
mongoose.set('debug', true);

exports.get = function(req, res) {
  var data = req.query;

  if (data.index && data.frequency) {
    Organization.findById(req.user.organization, function(err, organization) {
      if (!err && organization) {
        prefs.getGradeOptions(req.user.organization, function(err, gradeOptions) {
          prefs.getCourseOptions(req.user.organization, function(err, courseOptions) {
            prefs.getTrimesterOptions(req.user.organization, function(err, trimesterOptions) {
              builder.currentUserSemester({user: req.user.id}, function(err, currentUserSemester, currentSC) {
                res.render('report', {
                  user: req.user,
                  reportFields: organization.reportFields,
                  gradeOptions: gradeOptions,
                  courseOptions: courseOptions,
                  trimesterOptions: trimesterOptions,
                  currentUserSemester: currentUserSemester,
                  index: data.index,
                  reportFrequency: data.frequency
                });
              });
            });
          });
        });
      } else {
        res.send('error');
      }
    });
  } else {
    res.send('error');
  }
};
