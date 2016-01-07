var express = require('express');
var router = express.Router();
var app = express();

var User = require('../models/user.js');
var Semester = require('../models/semester.js');
var ClassInstance = require('../models/classinstance.js');
var HelpInstance = require('../models/helpinstance.js');
var Class = require('../models/class.js');

var prefs = require('./prefs');

var async = require('async');

exports.arrayToObjects = function(Document, array, callback) {
  var calls = [];
  if (array == [] || array === null || typeof array == 'undefined') {
    callback(null, []);
  }
  array.forEach(function(index){
    calls.push(function(response){
      Document.findById(index, function(err, object){
        response(err, object);
      });
    });
  });
  async.series(calls, function(err, objects){
    for (var x = 0; x < objects.length; x ++) {
      if (objects[x] === null) {
        objects.splice(x, 1);
        x --;
      }
    }
    callback(err, objects);
  });
};

exports.sort_by = function(field, reverse, primer) {
  var key = function(x) {
    return primer ? primer(x[field]) : x[field];
  };

  var reverseInt = !reverse ? 1 : -1;

  return function (a, b) {
    return a = key(a), b = key(b), reverseInt * ((a > b) - (b > a));
  };
};

exports.currentEpochTime = function() {
  return Math.round(new Date().getTime() / 1000);
};

exports.helpInstanceText = function(helpInstance) {
  var description = '';
  if (helpInstance.helpType == 0) {
    description += 'Studied ' + helpInstance.hours;
  } else if (helpInstance.helpType == 1) {
    description += 'Used resource "' + prefs.getHelpWebsiteByID(helpInstance.websiteID).title + '"';
  }
  return description;
}

exports.getJSONSemester = function(data, callback) {
  if (data.user && data.semester) {
    Semester.findById(data.semester, function(err, semester) {
      if (!err && semester) {
        exports.arrayToObjects(ClassInstance, semester.classInstances, function(err, classInstances){
          var calls = [];
          classInstances.forEach(function(classInstance){
            if (classInstance.isEnrolled) {
              calls.push(function(response){
                Class.findById(classInstance.class, function(err, fClass){
                  response(err, {
                    grade: classInstance.grade,
                    isEnrolled: classInstance.isEnrolled,
                    classCode: (fClass.classCode || '   '),
                    classIdentifier: (fClass.classIdentifier || 000),
                    id: classInstance._id
                  });
                });
              });
            }
          });
          async.series(calls, function(err, obj){
            callback(err, {
              trimester: semester.trimester,
              year: semester.year,
              id: semester.id,
              classes: obj
            });
          });
        });
      }
    });
  } else {
    callback('error', {});
  }
};
