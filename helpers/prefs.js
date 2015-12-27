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
  // var today = new Date();
  // var month = today.getMonth();
  // if (month < 3) { //JFM
  //   return ['Spring'];
  // } else if (month >= 3 && month < 7 ) { //AMJJ
  //   return ['Spring', 'Summer']
  // }
  return jsonContent.classes.semesters;
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
