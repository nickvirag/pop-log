var express = require('express');
var passport = require('passport');
var router = express.Router();

var builder = require('../helpers/builder');
var prefs = require('../helpers/prefs');
var async = require('async');

var app = express();

var mongoose = require('mongoose');
mongoose.set('debug', true);

var User = require('../models/user.js');
var Semester = require('../models/semester.js');
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
    res.render('semesters', {
      user: user,
      isNotUser: isNotUser,
      semesters: obj,
      gradeOptions: prefs.getGradeOptions(),
      yearOptions: prefs.getYearOptions(),
      courseOptions: prefs.getCourseOptions(),
      trimesterOptions: prefs.getTrimesterOptions(),
      currentTrimester: prefs.getCurrentTrimester()
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
    res.redirect('/semesters');
  }
};
