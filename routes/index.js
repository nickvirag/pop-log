var express = require('express');
var passport = require('passport');
var router = express.Router();

var app = express();

var prefs = require('../helpers/prefs');

var mongoose = require('mongoose');
mongoose.set('debug', true);

var url = '/';

exports.get = function(req, res){
  res.render('index', { user: req.user });
};
