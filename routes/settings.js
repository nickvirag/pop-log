var express = require('express');
var passport = require('passport');
var router = express.Router();

var app = express();

var Organization = require('../models/organization.js');

var mongoose = require('mongoose');
mongoose.set('debug', true);

exports.get = function(req, res) {
  Organization.findById(req.user.organization, function(err, organization) {
    res.render('settings', {
      user: req.user,
      organization: organization
    });
  });
};
