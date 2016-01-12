var express = require('express');
var router = express.Router();
var app = express();

var User = require('../models/user.js');
var Semester = require('../models/semester.js');
var ClassInstance = require('../models/classinstance.js');
var HelpInstance = require('../models/helpinstance.js');
var Class = require('../models/class.js');

var prefs = require('./prefs');

var dateFormat = require('dateformat');

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
    description += 'Studied ' + helpInstance.hours + ' hours';
  } else if (helpInstance.helpType == 1) {
    description += 'Used resource "' + prefs.getHelpWebsiteByID(helpInstance.websiteID).title + '"';
  }
  return description;
}

exports.getJSONSemester = function(user, data, callback) {
  if (data.user && data.semester) {
    if (user.id == data.user) {
      User.findById(data.user, function(err, user) {
        if (!err && user) {
          Semester.findById(data.semester, function(err, semester) {
            if (!err && semester) {
              exports.arrayToObjects(ClassInstance, semester.classInstances, function(err, classInstances) {
                var calls = [];
                classInstances.forEach(function(classInstance) {
                  if (classInstance.isEnrolled) {
                    calls.push(function(response){
                      Class.findById(classInstance.class, function(err, fClass) {
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
                prefs.getTrimesterOptions(user.organization, function(err, trimesterOptions) {
                  async.series(calls, function(err, obj) {
                    callback(err, {
                      trimester: semester.trimester,
                      trimesterLabel: trimesterOptions[semester.trimester],
                      year: semester.year,
                      id: semester.id,
                      classes: obj
                    });
                  });
                });
              });
            }
          });
        } else {
          callback('error', {});
        }
      });
    } else {
      callback('error', {});
    }
  } else {
    callback('error', {});
  }
};

exports.getJSONLogs = function(user, data, callback) {
  if (data.user) {
    if (user.id == data.user) {
      User.findById(data.user, function(err, user) {
        if (!err && user) {
          exports.arrayToObjects(HelpInstance, user.helpInstances, function(err, helpInstances) {
            var lastSunday = new Date();
            lastSunday.setDate(lastSunday.getDate() - lastSunday.getDay());
            lastSunday.setHours(0, 0, 0, 0);
            var addLog = function(addHelpInstance, addHelpClassText) {
              var date = new Date(addHelpInstance.completedDate * 1000);
              lastSunday.setHours(0, 0, 0, 0);
              return {
                completedDate: dateFormat(date, prefs.getDateFormat()),
                day: dateFormat(date, 'dddd'),
                class: addHelpClassText,
                description: exports.helpInstanceText(addHelpInstance),
                hours: addHelpInstance.helpType == 0 ? addHelpInstance.hours : 0
              };
            };
            var calls = [];
            helpInstances.forEach(function(helpInstance) {
              calls.push(function(response) {
                if (helpInstance.classInstance && helpInstance.classInstance != '') {
                  ClassInstance.findById(helpInstance.classInstance, function(err, classInstance) {
                    Class.findById(classInstance.class, function(err, fClass) {
                      response(err, addLog(helpInstance, fClass.classCode + ' ' + fClass.classIdentifier));
                    });
                  });
                } else {
                  response(null, addLog(helpInstance, 'Other'));
                }
              });
            });
            async.series(calls, function(err, logs) {
              callback(null, logs);
            });
          });
        } else {
          callback('error', null);
        }
      });
    } else {
      callback('user mismatch error', null);
    }
  } else {
    callback('missing parameters error', null);
  }
}
