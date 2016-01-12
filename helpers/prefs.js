var express = require('express');
var router = express.Router();
var app = express();

var fs = require('fs');

var Organization = require('../models/organization');

var contents = fs.readFileSync('./prefs.json');
var jsonContent = JSON.parse(contents);

exports.getGradeOptions = function(id, callback) {
  Organization.findById(id, function(err, organization) {
    callback(err, organization.classGrades);
  });
};

exports.getCourseOptions = function(id, callback) {
  Organization.findById(id, function(err, organization) {
    callback(err, organization.classTypes);
  });
};

exports.getTrimesterOptions = function(id, callback) {
  var semesters = [];
  jsonContent.classes.semesters.forEach(function(semester) {
    semesters.push(semester.label);
  });
  callback(null, semesters);
};

exports.getDateFormat = function() {
  return 'dddd, mmmm dS, h:MM:ss TT';
};

exports.getCurrentTrimester = function() {
  var date = new Date();
  var currentMonth = date.getMonth() + 1;
  var currentDay = date.getDate() + 1;
  var semesters = jsonContent.classes.semesters;
  var currentSemester = -1;
  for (var x = 0, semester = {}; x < semesters.length; x ++) {
    semester = semesters[x];
    if (currentMonth >= semester.startMonth && currentMonth <= semester.endMonth) {
      if (currentMonth == semester.startMonth) {
        if (currentDay >= semester.startDay) {
          currentSemester = x;
          break;
        }
      } else if (currentMonth == semester.endMonth) {
        if (currentDay <= semester.endDay) {
          currentSemester = x;
          break;
        }
      } else {
        currentSemester = x;
        break;
      }
    }
  }
  return currentSemester;
};

exports.getCurrentYear = function () {
  return new Date().getYear();
};

exports.getDatabaseURI = function() {
  return jsonContent.database.uri;
};

exports.getGoogleClientID = function() {
  return jsonContent.auth.google.client_id;
};

exports.getGoogleClientSecret = function() {
  return jsonContent.auth.google.client_secret;
};

exports.getDatabaseURI = function() {
  return jsonContent.database.uri;
};

exports.getYearOptions = function() {
  var today = new Date();
  var year = today.getFullYear();
  return (today.getMonth() < 9) ? [year] : [year, year + 1];
};

exports.getHelpWebsites = function() {
  return jsonContent.help.websites;
};

exports.getLabel = function() {
  return jsonContent.label;
};

exports.getHelpWebsiteByID = function(id) {
  var response = {};
  var BreakException = {};
  try {
    jsonContent.help.websites.forEach(function(website) {
      if (website.id == id) {
        response = website;
        throw BreakException;
      }
    });
  } catch (e) {
    if (e !== BreakException) {
      throw e;
    }
  }
  return response;
};
