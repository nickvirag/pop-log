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
var Organization = require('../models/organization.js');

exports.get = function(req, res) {
  if (req.user.organization) {
    res.redirect('/user');
  } else {
    Organization.find(function(err, organizations) {
      res.render('join', {
        user: req.user,
        organizations: organizations
      });
    });
  }
};
