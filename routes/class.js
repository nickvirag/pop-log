var express = require('express');
var passport = require('passport');
var router = express.Router();

var app = express();

var prefs = require('../helpers/prefs');

var mongoose = require('mongoose');
mongoose.set('debug', true);

exports.new = function(req, res){
  res.render('class', { user: req.user, yearOptions: prefs.getYearOptions(), courseOptions: prefs.getCourseOptions(), gradeOptions: prefs.getGradeOptions() });
};
