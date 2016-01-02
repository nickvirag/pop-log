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
var HelpInstance = require('../models/helpinstance.js');
var Class = require('../models/class.js');

exports.get = function(req, res){
  console.log('HIN: ' + req.user.helpInstances);
  builder.arrayToObjects(HelpInstance, req.user.helpInstances, function(err, userHelpInstances){
    console.log('HIN2: ' + userHelpInstances);
    res.render('logs', {
      user: req.user,
      helpInstances: userHelpInstances
    });
  });
};
