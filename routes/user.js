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
  var calls = [];
  user.semesters.forEach(function(semester) {
    calls.push(function(response){
      builder.getJSONSemester({
          user: user,
          semester: semester
        },
        function(err, resp){
          response(err, resp);
        }
      );
    });
  });
  async.series(calls, function(err, obj){
    builder.arrayToObjects(HelpInstance, user.helpInstances, function(err, helpInstances){
      var lastSunday = new Date();
      lastSunday.setDate(lastSunday.getDate() - lastSunday.getDay());
      lastSunday.setHours(0, 0, 0, 0);
      res.render('user', {
        user: user,
        isNotUser: isNotUser,
        semesters: obj.sort(builder.sort_by('year', false, parseInt)).sort(builder.sort_by('trimester', false, parseInt)),
        gradeOptions: prefs.getGradeOptions(),
        yearOptions: prefs.getYearOptions(),
        courseOptions: prefs.getCourseOptions(),
        trimesterOptions: prefs.getTrimesterOptions(),
        currentTrimester: prefs.getCurrentTrimester(),
        lastSunday: dateFormat(lastSunday, prefs.getDateFormat()),
        helpInstances: helpInstances,
        websites: prefs.getHelpWebsites()
      });
    });
  });
}

exports.get = function(req, res){
  renderUser(res, req.user, false);
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
