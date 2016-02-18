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
var Report = require('../models/report.js');

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

exports.currentUserSemester = function(data, callback) {
  if (data.user) {
    User.findById(data.user, function(err, user) {
      if (!err && user) {
        Organization.findById(user.organization, function(err, organization) {
          if (!err && organization) {
            exports.arrayToObjects(SemesterContainer, organization.semesterContainers, function(err, semesterContainers) {
              var today = new Date();
              var minDate = new Date();
              var maxDate = new Date();
              var currentSCs = [];
              var currentSCObjects = [];
              semesterContainers.forEach(function(semesterContainer) {
                minDate.setMonth(semesterContainer.startMonth - 1);
                minDate.setDate(semesterContainer.startDay);
                maxDate.setMonth(semesterContainer.endMonth - 1);
                maxDate.setDate(semesterContainer.endDay);
                if (minDate <= today && today <= maxDate) {
                  currentSCs.unshift(semesterContainer.id);
                  currentSCObjects.unshift(semesterContainer);
                }
              });
              exports.arrayToObjects(Semester, user.semesters, function(err, semesters) {
                var currentSemester = null;
                var currentSC = {};
                var semesterFound = {};
                var year = today.getFullYear();
                try {
                  semesters.forEach(function(semester) {
                    var container = semester.semesterContainer;
                    for (var index = 0; index < currentSCs.length; index ++) {
                      if (semester.year == year && String(currentSCs[index]) === String(container)) {
                        currentSemester = semester;
                        currentSC = currentSCObjects[index];
                        throw semesterFound;
                      }
                    }
                  });
                } catch (e) {
                  if (e !== semesterFound) {
                    throw e;
                  }
                }
                callback(currentSemester ? null : 'error', currentSemester, currentSC);
              });
            });
          } else {
            callback('error', null);
          }
        });
      } else {
        callback('error', null);
      }
    });
  } else {
    callback('error', null);
  }
};

exports.currentUserCategory = function(data, callback) {
  if (data.user) {
    exports.currentUserSemester({user: data.user.id}, function(err, semester, semesterContainer) {
      if (!err && semester && semesterContainer) {
        exports.getCategoryFromSemester({semester: semester.id}, function(err, category) {
          if (!err && category) {
            callback(null, category);
          } else {
            callback('error 3', null);
          }
        });
      } else {
        callback('error 2', null);
      }
    });
  } else {
    callback('error 1', null);
  }
};

exports.userReportDetails = function(data, callback) {
  if (data.user && data.organization) {
    User.findById(data.user, function(err, user) {
      if (!err && user) {
        exports.currentUserSemester({user: user.id}, function(err, semester, semesterContainer) {
          if (!err && semester && semesterContainer) {
            exports.getCategoryFromSemester({semester: semester.id}, function(err, category) {
              if (!err && category) {
                var today = new Date();
                var startDate = new Date();
                var endDate = new Date();

                startDate.setMonth(semesterContainer.startMonth - 1);
                startDate.setDate(semesterContainer.startDay);
                startDate.setHours(0, 0, 0, 0);
                endDate.setMonth(semesterContainer.endMonth - 1);
                endDate.setDate(semesterContainer.endDay);
                endDate.setHours(23, 59, 59, 999);

                var saturdays = [];
                var saturday = startDate;

                saturday.setDate(saturday.getDate() - saturday.getDay() + 6);
                saturday.setHours(23, 59, 59, 999);

                for(; saturday < endDate; saturday.setDate(saturday.getDate() + 7)) {
                  saturdays.push(new Date(saturday));
                }

                var reportDueDates = [];
                var isNextReport = false;

                var readReports = [];

                var addToReport = function(reportDueDate, index) {
                  var days = Math.round((today.getTime() - reportDueDate.getTime()) / 86400000);
                  var submitted = false;
                  for (var x = 0; x < readReports.length; x ++) {
                    var report = readReports[x];
                    if (report.index == index && report.frequency == category.reportFrequency) {
                      submitted = true;
                      break;
                    }
                  }
                  var submittable = Math.abs(days) <= 7 && !submitted;
                  if (submittable || isNextReport) {
                    reportDueDates.push({
                      dueDate: dateFormat(reportDueDate, 'mmm d'),
                      submittable: submittable,
                      overdue: days > 0 && !submitted,
                      index: index,
                      frequency: category.reportFrequency,
                      isNextReport: isNextReport
                    });
                  }
                  isNextReport = !isNextReport && submitted;
                };

                exports.arrayToObjects(Report, semester.reports, function(err, reports) {

                  if (reports) {
                    reports.forEach(function(report) {
                      readReports.push({
                        index: report.index,
                        frequency: report.reportFrequency
                      });
                    });
                  }

                  if (category.reportFrequency == 0) {
                    saturdays.forEach(function(day, index) {
                      addToReport(day, index);
                    });
                  } else if (category.reportFrequency == 1) {
                    var rIndex = 0;
                    saturdays.forEach(function(day, index) {
                      if (index % 2 == 1) {
                        addToReport(day, rIndex);
                        rIndex ++;
                      }
                    });
                  } else if (category.reportFrequency == 2) {

                  } else if (category.reportFrequency == 3) {
                    addToReport(saturdays[Math.floor(saturdays.length / 2)], 0);
                  } else if (category.reportFrequency == 4) {
                    addToReport(saturdays[saturdays.length - 1], 0);
                  }
                  callback(null, reportDueDates);
                });
              } else {
                callback('error', null);
              }
            });
          } else {
            callback('error', null);
          }
        });
      } else {
        callback('error', null);
      }
    });
  } else {
    callback('error', null);
  }
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
              exports.userReportDetails({
                user: user.id,
                organization: user.organization
              }, function(errReport, reportDetails) {
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
                        cumulativeGPA: semester.reportedGPA,
                        reportDates: reportDetails,
                        classes: obj
                      });
                    });
                  });
                });
              });
            } else {
              callback('error', {});
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
        Organization.findById(semester.organization, function(err, organization) {
          if (!err && organization) {
            exports.arrayToObjects(Category, organization.categories, function(err, categories) {
              if (!err && categories) {
                var semesterCategory = {};
                var categoryFound = {};
                try {
                  categories.forEach(function(category) {
                    if (category.isActive && category.minimumGPA <= semester.reportedGPA && semester.reportedGPA <= category.maximumGPA) {
                      semesterCategory = category;
                      throw categoryFound;
                    }
                  });
                } catch (e) {
                  if (e !== categoryFound) {
                    throw e;
                  }
                }
                if (semesterCategory != {}) {
                  callback(null, semesterCategory);
                } else {
                  callback('error', null);
                }
              } else {
                callback('error', null);
              }
            });
          } else {
            callback('error', null);
          }
        });
      } else {
        callback('error', null);
      }
    });
  } else {
    callback('error', null);
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
              return;
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
            var retLogs = [];
            for (var x = 0; x < logs.length; x ++) {
              if (logs[x]) {
                retLogs.push(logs[x]);
              }
            }
            callback(null, retLogs);
          });
        });
      } else {
        callback('error', null);
      }
    });
  } else {
    callback('error', null);
  }
}
