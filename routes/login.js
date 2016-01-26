var express = require('express');
var passport = require('passport');
var router = express.Router();

var app = express();

var mongoose = require('mongoose');
mongoose.set('debug', true);

var url = '/login';

exports.get = function(req, res){
  if (req.user) {
    res.redirect('/');
  } else {
    res.render('login', { user: req.user });
  }
};
