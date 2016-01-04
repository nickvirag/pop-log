var express = require('express');
var router = express.Router();
var app = express();

var fs = require('fs');

var contents = fs.readFileSync('./prefs.json');
var jsonContent = JSON.parse(contents);

exports.getGradeOptions = function() {
  return jsonContent.classes.grades;
}

exports.getCourseOptions = function() {
  return jsonContent.classes.types;
}

exports.getTrimesterOptions = function() {
  var semesters = [];
  jsonContent.classes.semesters.forEach(function(semester) {
    semesters.push(semester.label);
  });
  return semesters;
}

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
}

exports.getCurrentYear = function () {
  return new Date().getYear();
}

exports.getDatabaseURI = function() {
  return jsonContent.database.uri;
}

exports.getGoogleClientID = function() {
  return jsonContent.auth.google.client_id;
}

exports.getGoogleClientSecret = function() {
  return jsonContent.auth.google.client_secret;
}

exports.getDatabaseURI = function() {
  return jsonContent.database.uri;
}

exports.getYearOptions = function() {
  var today = new Date();
  var year = today.getFullYear();
  return (today.getMonth() < 9) ? [year] : [year, year + 1];
}

exports.getHelpWebsites = function() {
  return jsonContent.help.websites;
}

exports.getAdminOverride = function() {
  return jsonContent.override.admin;
}
