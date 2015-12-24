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

var url = '/user';

var renderUser = function(res, user, isNotUser){
  builder.arrayToObjects(Semester, user.semesters, function(err, semesters){
    var calls = [];
    semesters.forEach(function(semester){
      calls.push(function(response){
        builder.arrayToObjects(ClassInstance, semester.classInstances, function(err, classInstances){
          var responseClassInstances = [];
          var instanceCalls = [];
          classInstances.forEach(function(classInstance){
            instanceCalls.push(function(instanceResponse){
              Class.findById(classInstance.class, function(err, fClass){
                instanceResponse(err, {
                  grade: classInstance.grade,
                  isEnrolled: classInstance.isEnrolled,
                  classCode: (fClass.classCode || '   '),
                  classIdentifier: (fClass.classIdentifier || 000),
                  id: classInstance._id
                });
              });
            });
          });
          async.series(instanceCalls, function(err, obj){
            response(err,{
              trimester: semester.trimester,
              year: semester.year,
              classes: obj
            });
          });
        });
      });
    });
    async.series(calls, function(err, obj){
      res.render('user', { user: user, isNotUser: isNotUser, semesters: obj, gradeOptions: prefs.getGradeOptions() });
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
