var express = require('express');
var router = express.Router();
var app = express();

var User = require('../models/user.js');
var SemesterContainer = require('../models/semestercontainer.js');
var Semester = require('../models/semester.js');
var ClassInstance = require('../models/classinstance.js');
var Category = require('../models/category.js');
var Organization = require('../models/organization.js');
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
  array.forEach(function(index) {
    calls.push(function(response) {
      Document.findById(index, function(err, object) {
        response(err, object);
      });
    });
  });
  async.series(calls, function(err, objects) {
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

exports.createSemester = function(data, callback) {
  if (data.semesterContainer && data.year && data.user) {
    SemesterContainer.findById(data.semesterContainer, function(err, semesterContainer) {
      Semester.findOne({
        user: data.user,
        semesterContainer: semesterContainer.id,
        year: data.year
      }).exec(function(err, semester) {
        if (!err && semester) {
          callback('error', null);
        } else {
          User.findById(data.user, function(err, user) {
            if (!err && user) {
              var semester = new Semester({
                user: data.user,
                trimesterLabel: semesterContainer.label,
                year: data.year,
                semesterContainer: semesterContainer.id,
                organization: semesterContainer.organization
              });
              semester.save(function(err) {
                user.semesters.unshift(semester.id);
                user.updatedAt = exports.currentEpochTime();
                user.save();
                semesterContainer.semesters.unshift(semester.id);
                semesterContainer.updatedAt = exports.currentEpochTime();
                semesterContainer.save();
                callback(null, semester);
              });
            } else {
              callback('error', null);
            }
          });
        }
      });
    });
  } else {
    callback('error', null);
  }
};

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
                    calls.push(function(response) {
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
                    var tOption = {};
                    trimesterOptions.forEach(function(trimesterOption) {
                      if (semester.trimester == trimesterOption.id) {
                        tOption = trimesterOption;
                      }
                    });
                    callback(err, {
                      semesterContainer: semester.semesterContainer,
                      trimesterLabel: semester.trimesterLabel,
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

exports.getCategoryFromSemester = function(data, callback) {
  if (data.semester) {
    Semester.findById(data.semester, function(err, semester) {
      if (!err && semester) {
        console.log(semester.organization);
        Organization.findById(semester.organization, function(err, organization) {
          if (!err && organization) {
            exports.arrayToObjects(Category, organization.categories, function(err, categories) {
              if (!err && categories) {
                var semesterCategory = {};
                var categoryFound = {};
                try {
                  categories.forEach(function(category) {
                    if (category.isActive && category.minimumGPA <= semester.reportedGPA && semester.reportedGPA >= category.maximumGPA) {
                      semesterCategory = category;
                      throw categoryFound;
                    }
                  });
                } catch (e) {
                  if (e !== categoryFound) {
                    throw e;
                  }
                }
                callback(null, categoryFound);
              } else {
                callback('categories error', null);
              }
            });
          } else {
            callback('org error ' + err, null);
          }
        });
      } else {
        callback('semester error', null);
      }
    });
  } else {
    callback('input error', null);
  }
}

exports.getJSONLogs = function(data, callback) {
  if (data.user) {
    User.findById(data.user, function(err, user) {
      if (!err && user) {
        exports.arrayToObjects(HelpInstance, user.helpInstances, function(err, helpInstances) {
          var startDate = data.weekOf ? new Date(data.weekOf * 1000) : new Date();
          var endDate = new Date();
          startDate.setDate(startDate.getDate() - startDate.getDay());
          startDate.setHours(0, 0, 0, 0);
          endDate.setDate(startDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
          var addLog = function(addHelpInstance, addHelpClassText) {
            var date = new Date(addHelpInstance.completedDate * 1000);
            if (startDate < date && date < endDate) {
              return {
                completedDate: dateFormat(date, prefs.getDateFormat()),
                day: dateFormat(date, 'dddd'),
                class: addHelpClassText,
                description: exports.helpInstanceText(addHelpInstance),
                hours: addHelpInstance.helpType == 0 ? addHelpInstance.hours : 0
              };
            } else {
              return null;
            }
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
    callback('missing parameters error', null);
  }
}
