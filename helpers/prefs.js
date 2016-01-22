var express = require('express');
var router = express.Router();
var app = express();

var Organization = require('../models/organization');
var SemesterContainer = require('../models/semestercontainer.js');

var builder = require('../helpers/builder.js');

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
  Organization.findById(id, function(err, organization) {
    builder.arrayToObjects(SemesterContainer, organization.semesterContainers, function(err, semesterContainers) {
      var semesters = [];
      semesterContainers.forEach(function(semesterContainer) {
        semesters.push({
          label: semesterContainer.label,
          id: semesterContainer._id
        });
      });
      callback(err, semesters);
    });
  });
};

exports.getDateFormat = function() {
  return 'dddd, mmmm dS, h:MM:ss TT';
};

exports.getCurrentTrimester = function(id, callback) {
  Organization.findById(id, function(err, organization) {
    builder.arrayToObjects(SemesterContainer, organization.semesterContainers, function(err, semesterContainers) {
      var date = new Date();
      var currentMonth = date.getMonth() + 1;
      var currentDay = date.getDate() + 1;
      var currentSemester = {};
      var currentSemesterFound = {};
      try {
        semesterContainers.forEach(function(semester) {
          if (currentMonth >= semester.startMonth && currentMonth <= semester.endMonth) {
            if (currentMonth == semester.startMonth) {
              if (currentDay >= semester.startDay) {
                currentSemester = semester;
                throw currentSemesterFound;
              }
            } else if (currentMonth == semester.endMonth) {
              if (currentDay <= semester.endDay) {
                currentSemester = semester;
                throw currentSemesterFound;
              }
            } else {
              currentSemester = semester;
              throw currentSemesterFound;
            }
          }
        });
      } catch (e) {
        if (e !== currentSemesterFound) {
          throw e;
        }
      }
      callback(err, currentSemester);
    });
  });
};

exports.getCurrentYear = function () {
  return new Date().getYear();
};

exports.broadcastEmailVerified = function(organizationId, response) {
  Organization.findById(organizationId, function(err, organization) {
    response(err, organization.emailUsername != '' && organization.emailPassword != '');
  });
}

exports.getDatabaseURI = function() {
  return process.env.DATABASE_URI;
};

exports.getGoogleClientID = function() {
  return process.env.GOOGLE_CLIENT_ID;
};

exports.getGoogleClientSecret = function() {
  return process.env.GOOGLE_CLIENT_SECRET;
};

exports.getWebURL = function() {
  return process.env.WEB_URL;
};

exports.getSiteTitle = function() {
  return process.env.WEB_TITLE || '💩log';
};

exports.getYearOptions = function() {
  var today = new Date();
  var year = today.getFullYear();
  return (today.getMonth() < 9) ? [year] : [year, year + 1];
};
