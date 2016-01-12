var express = require('express');
var passport = require('passport');
var router = express.Router();

var builder = require('../helpers/builder');
var prefs = require('../helpers/prefs');
var async = require('async');
var dateFormat = require('dateformat');

var app = express();

var mongoose = require('mongoose');
mongoose.set('debug', true);

var User = require('../models/user.js');
var Semester = require('../models/semester.js');
var HelpInstance = require('../models/helpinstance.js');
var ClassInstance = require('../models/classinstance.js');
var Class = require('../models/class.js');

var renderUser = function(res, user, isNotUser){
  builder.arrayToObjects(HelpInstance, user.helpInstances, function(err, helpInstances){
    var lastSunday = new Date();
    lastSunday.setDate(lastSunday.getDate() - lastSunday.getDay());
    lastSunday.setHours(0, 0, 0, 0);
    prefs.getGradeOptions(user.organization, function(err, gradeOptions) {
      prefs.getCourseOptions(user.organization, function(err, courseOptions) {
        prefs.getTrimesterOptions(user.organization, function(err, trimesterOptions) {
          res.render('user', {
            user: user,
            isNotUser: isNotUser,
            gradeOptions: gradeOptions,
            yearOptions: prefs.getYearOptions(),
            courseOptions: courseOptions,
            trimesterOptions: trimesterOptions,
            currentTrimester: prefs.getCurrentTrimester(),
            lastSunday: dateFormat(lastSunday, prefs.getDateFormat()),
            helpInstances: helpInstances,
            websites: prefs.getHelpWebsites()
          });
        });
      });
    });
  });
}

exports.get = function(req, res) {
  if (req.user.organization) {
    if (req.user.isAdmin) {
      res.redirect('/admin');
    } else {
      renderUser(res, req.user, false);
    }
  } else {
    res.redirect('join');
  }
};

exports.getById = function(req, res){
  if (req.params[0] == req.user._id) {
    renderUser(res, req.user, false);
  } else if (req.user.isAdmin) {
    User.findOne({
      _id: req.params[0]
    }).exec( function(err, user) {
      renderUser(res, user, true);
    });
  } else {
    res.redirect('/user');
  }
};
