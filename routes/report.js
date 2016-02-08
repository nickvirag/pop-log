var express = require('express');
var passport = require('passport');
var router = express.Router();

var app = express();

var Organization = require('../models/organization.js');

var mongoose = require('mongoose');
mongoose.set('debug', true);

exports.get = function(req, res) {
  Organization.findById(req.user.organization, function(err, organization) {
    if (!err && organization) {
      res.render('report', {
        user: req.user,
        reportFields: organization.reportFields
      });
    } else {
      res.send('error');
    }
  });
};
