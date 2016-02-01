var express = require('express');
var passport = require('passport');
var router = express.Router();

var app = express();

var mongoose = require('mongoose');
mongoose.set('debug', true);

exports.get = function(req, res) {
  res.render('report', { user: req.user });
};
