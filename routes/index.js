var express = require('express');
var passport = require('passport');
var router = express.Router();

var app = express();

var prefs = require('../helpers/prefs');

var mongoose = require('mongoose');
mongoose.set('debug', true);

var url = '/';

exports.get = function(req, res) {
  if (req.user) {
    if (req.user.isAdmin) {
      res.redirect('/admin');
    } else {
      res.redirect('/user');
    }
  } else {
    res.redirect('/login');
  }
};
