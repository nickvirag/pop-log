var express = require('express');
var passport = require('passport');
var router = express.Router();

var app = express();

var mongoose = require('mongoose');
mongoose.set('debug', true);

var User = require('../models/user.js');
var Semester = require('../models/semester.js');
var SemesterContainer = require('../models/semestercontainer.js');
var ClassInstance = require('../models/classinstance.js');
var HelpInstance = require('../models/helpinstance.js');
var Class = require('../models/class.js');
var Organization = require('../models/organization.js');
var Category = require('../models/category.js');
var Report = require('../models/report.js');

var builder = require('../helpers/builder');
var prefs = require('../helpers/prefs');
var broadcast = require('../helpers/broadcast');
var dateFormat = require('dateformat');
var async = require('async');

exports.updateClassInstance = function(req, res){
  var data = req.body;
  if (data.grade && data.id) {
    ClassInstance.findById(data.id, function(err, classInstance) {
      if (!err && classInstance) {
        if (classInstance.user == req.user.id) {
          classInstance.grade = data.grade;
          classInstance.updatedAt = builder.currentEpochTime();
          classInstance.save(function(err) {
            res.send(classInstance);
          });
        } else {
          res.send('error');
        }
      } else {
        res.send('error');
      }
    });
  }
};

exports.dropClassInstance = function(req, res){
  var data = req.body;
  if (data.excuse && data.id) {
    ClassInstance.findById(data.id, function(err, classInstance) {
      if (!err && classInstance) {
        if (classInstance.user == req.user.id) {
          classInstance.isEnrolled = false;
          classInstance.dropExcuse = data.dropExcuse;
          classInstance.updatedAt = builder.currentEpochTime();
          classInstance.save();
          res.send(classInstance);
        } else {
          res.send('error');
        }
      } else {
        res.send('error');
      }
    });
  }
};

exports.getSemester = function(req, res) {
  var data = req.query;
  builder.getJSONSemester(req.user, data, function(err, response) {
    res.send(response);
  });
};

exports.getSemesters = function(req, res) {
  var data = req.query;
  var calls = [];
  req.user.semesters.forEach(function(semester) {
    calls.push(function(response) {
      builder.getJSONSemester(req.user, {
          user: req.user.id,
          semester: semester
        },
        function(err, resp){
          response(err, resp);
        }
      );
    });
  });
  async.series(calls, function(err, obj) {
    res.send(obj.sort(builder.sort_by('year', false, parseInt)).sort(builder.sort_by('trimester', false, parseInt)));
  });
};

exports.setSelectedSemester = function(req, res) {
  var data = req.body;
  if (data.semester) {
    if (data.semester != req.user.selectedSemester) {
      req.user.selectedSemester = data.semester;
      req.user.updatedAt = builder.currentEpochTime();
      req.user.save(function(err) {
        res.send(req.user);
      });
    } else {
      res.send(req.user);
    }
  } else {
    res.send('error');
  }
}

exports.updateSettings = function(req, res) {
  var data = req.body;
  Organization.findById(req.user.organization, function(err, organization) {
    if (!err && organization) {
      var hasChanged = false;
      if (data.emailUsername) {
        organization.emailUsername = data.emailUsername;
        hasChanged = true;
      }
      if (data.emailPassword) {
        organization.emailPassword = data.emailPassword;
        hasChanged = true;
      }
      if (hasChanged) {
        organization.updatedAt = builder.currentEpochTime();
        organization.save(function(err) {
          res.send(organization);
        });
      } else {
        res.send('error');
      }
    } else {
      res.send('error');
    }
  });
};

exports.setHoursDueTime = function(req, res) {
  var data = req.body;
  if (data.organization && data.hoursDueDay && data.hoursDueTime) {
    if (req.user.organization == data.organization) {
      Organization.findById(data.organization, function(err, organization) {
        if (!err && organization) {
          organization.hoursDueDay = data.hoursDueDay;
          var timeSplit = data.hoursDueTime.split(':');
          if (data.hoursDueDay == '1') {
            timeSplit[0] += 12;
          }
          organization.hoursDueMinutes = (timeSplit[0] * 60) + timeSplit[1];
          organization.updatedAt = builder.currentEpochTime();
          organization.save(function(err) {
            res.send(organization);
          });
        } else {
          res.send('error');
        }
      });
    } else {
      res.send('error');
    }
  } else {
    res.send('error');
  }
};

exports.getClassHelp = function(req, res) {
  var data = req.query;
  if (data.id) {
    ClassInstance.findById(data.id, function(err, classInstance) {
      if (!err && classInstance) {
        Class.findById(classInstance.class, function(err, fClass) {
          if (!err && fClass) {
            var helpObject = {};
            helpObject.users = [];
            // helpObject.websites = prefs.getHelpWebsites();
            builder.arrayToObjects(User, fClass.users, function(err, users){
              users.forEach(function(user){
                if (user.id != data.user) {
                  helpObject.users.unshift({
                    name: user.displayName,
                    email: user.email
                  });
                }
              });
              res.send(helpObject);
            });
          }
        });
      } else {
        res.send('missing class error');
      }
    });
  } else {
    res.send('missing parameters error');
  }
};

exports.getLogs = function(req, res) {
  var data = req.query;
  builder.getJSONLogs(data, function(err, response) {
    res.send(response);
  });
};

exports.getActiveUsersByTrimester = function(req, res) {
  var data = req.query;
  if (data.semesterContainer && data.year && data.organization) {
    SemesterContainer.findById(data.semesterContainer, function(err, semesterContainer) {
      if (!err && semesterContainer) {
        Organization.findById(data.organization, function(err, organization) {
          if (!err && organization) {
            builder.arrayToObjects(User, organization.users, function(err, users) {
              if (!err && users) {
                var calls = [];
                users.forEach(function(user) {
                  if (user.isActive) {
                    calls.push(function(response) {
                      builder.arrayToObjects(Semester, user.semesters, function(err, semesters) {
                        if (!err && semesters) {
                          var matchFound = {};
                          var matchedSemester = null;
                          try {
                            semesters.forEach(function(semester) {
                              if (semester.semesterContainer == data.semesterContainer && semester.year == data.year) {
                                matchedSemester = semester;
                                throw matchFound;
                              }
                            });
                          } catch(e) {
                            if (e !== matchFound) {
                              throw e;
                            }
                          }
                          var userObject = {
                            displayName: user.displayName,
                            email: user.email,
                            id: user.id
                          };
                          if (matchedSemester) {
                            builder.getCategoryFromSemester({semester: matchedSemester.id}, function(err, category) {
                              userObject.isRegistered = true;
                              userObject.categoryLabel = category.label;
                              userObject.categoryID = category.id;
                              userObject.categoryHours = category.minimumStudyHours;
                              userObject.reportedGPA = matchedSemester.reportedGPA;
                              userObject.semester = matchedSemester.id;
                              userObject.hours = null;
                              userObject.grades = '';

                              var startWeek = new Date();
                              var semesterStart = new Date();
                              var startWeek = new Date();
                              semesterStart.setMonth(semesterContainer.startMonth - 1);
                              semesterStart.setDate(semesterContainer.startDay);
                              var weeks = [];
                              while (startWeek > semesterStart) {
                                weeks.unshift(new Date(startWeek));
                                startWeek.setDate(startWeek.getDate() - 7);
                              }

                              var hourCalls = [];

                              weeks.forEach(function(week) {
                                hourCalls.push(function(response) {
                                  builder.getJSONLogs({
                                    user: userObject.id,
                                    weekOf: (week.getTime() / 1000)
                                  }, function(err, logs) {
                                    var hours = 0;
                                    logs.forEach(function(log) {
                                      hours += log.hours;
                                    });
                                    response(null, hours);
                                  });
                                });
                              });

                              async.series(hourCalls, function(err, hours) {
                                userObject.hours = hours;
                                builder.arrayToObjects(ClassInstance, matchedSemester.classInstances, function(err, classInstances) {
                                  prefs.getGradeOptions(organization.id, function(err, gradeOptions) {
                                    if (!err && gradeOptions) {
                                      classInstances.forEach(function(classInstance) {
                                        userObject.grades += ' ' + gradeOptions[classInstance.grade];
                                      });
                                    }
                                    response(null, userObject);
                                  });
                                });
                              });


                              // builder.getJSONLogs({
                              //   user: userObject.id,
                              //   weekOf: (lastWeek.getTime() / 1000)
                              // }, function(err, logs) {
                              //   var hours = 0;
                              //   logs.forEach(function(log) {
                              //     hours += log.hours;
                              //   });
                              //
                              // });
                            });
                          } else {
                            userObject.isRegistered = false;
                            userObject.categoryLabel = null;
                            userObject.categoryID = null;
                            userObject.reportedGPA = null;
                            userObject.semester = null;
                            userObject.hours = null;
                            userObject.grades = null;
                            response(null, userObject);
                          }
                        } else {
                          res.send('error');
                        }
                      });
                    });
                  }
                });
                async.series(calls, function(err, resp) {
                  res.send(resp);
                });
              } else {
                res.send('error');
              }
            });
          } else {
            res.send('error');
          }
        });
      } else {
        res.send('error');
      }
    });
  } else {
    res.send('error');
  }
}

exports.postUserGPA = function(req, res) {
  var data = req.body;
  if (data.reportedGPA) {
    var reportedGPA;
    if (data.reportedGPA > 99) {
      reportedGPA = 99;
    } else if (data.reportedGPA < -99) {
      reportedGPA = -99;
    } else {
      reportedGPA = data.reportedGPA;
    }
    if (data.semester) {
      Semester.findById(data.semester, function(err, semester) {
        if (!err && semester) {
          semester.reportedGPA = reportedGPA;
          semester.updatedAt = builder.currentEpochTime();
          semester.save(function(err) {
            res.send(semester);
          });
        } else {
          res.send('error');
        }
      });
    } else if (data.semesterContainer && data.year) {
      builder.createSemester(data, function(err, semester) {
        if (!err && semester) {
          semester.reportedGPA = reportedGPA;
          semester.updatedAt = builder.currentEpochTime();
          semester.save(function(err) {
            res.send(semester);
          });
        } else {
          res.send('error');
        }
      });
    } else {
      res.send('error');
    }
  } else {
    res.send('error');
  }
}

exports.joinOrganization = function(req, res) {
  var data = req.body;
  if (data.organization) {
    Organization.findById(data.organization, function(err, organization) {
      if (!err && organization) {
        req.user.organization = organization._id;
        req.user.updatedAt = builder.currentEpochTime();
        req.user.save();
        organization.users.unshift(req.user.id);
        var index = organization.invitedUsers.indexOf(req.user.email);
        if (index != -1) {
          organization.invitedUsers.splice(index, 1);
          organization.invitedUserStatuses.splice(index, 1);
        }
        organization.updatedAt = builder.currentEpochTime();
        organization.save();
        res.send(organization);
      } else {
        res.send('error');
      }
    });
  } else {
    res.send('error');
  }
};

exports.postNewOrganization = function(req, res) {
  var data = req.body;
  if (data.displayName && data.location) {
    var admins = data.admins ? data.admins.split(',') : [];
    admins.push(data.user);
    var organization = new Organization({
      displayName: data.displayName,
      admins: admins,
      location: data.location,
      classGrades: data.classGrades ? data.classGrades.split(',') : ['⎯', 'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F']
    });
    if (data.designation) {
      organization.designation = data.designation;
    }
    if (data.memberLabel) {
      organization.memberLabel = data.memberLabel;
    }
    if (data.memberLabelPlural) {
      organization.memberLabelPlural = data.memberLabelPlural;
    }
    if (data.classTypes) {
      organization.classTypes = data.classTypes.split(',');
    }
    if (data.security) {
      organization.security = data.security;
      if (data.security == 0 && data.blockedDomains) {
        organization.blockedDomains = data.blockedDomains.split(',');
      } else if (data.security == 1 && data.allowedDomains) {
        organization.allowedDomains = data.allowedDomains.split(',');
      } else if (data.security == 2 && data.allowedAddresses) {
        organization.allowedAddresses = data.allowedAddresses.split(',');
      }
    }
    organization.save(function(err) {
      var semesterContainer = new SemesterContainer({
        label: 'Spring',
        startMonth: 1,
        startDay: 11,
        endMonth: 5,
        endDay: 11
      });
      semesterContainer.organization = organization.id;
      semesterContainer.save(function(err) {
        organization.semesterContainers.unshift(semesterContainer);
        semesterContainer = new SemesterContainer({
          label: 'Summer',
          startMonth: 5,
          startDay: 16,
          endMonth: 7,
          endDay: 22
        });
        semesterContainer.organization = organization.id;
        semesterContainer.save(function(err) {
          organization.semesterContainers.unshift(semesterContainer);
          semesterContainer = new SemesterContainer({
            label: 'Fall',
            startMonth: 8,
            startDay: 24,
            endMonth: 12,
            endDay: 17
          });
          semesterContainer.organization = organization.id;
          semesterContainer.save(function(err) {
            organization.semesterContainers.unshift(semesterContainer);
            organization.save(function(err) {
              var calls = [];
              admins.forEach(function(admin) {
                calls.push(function(response) {
                  User.findById(admin, function(err, user) {
                    user.organization = organization.id;
                    user.isAdmin = true;
                    user.updatedAt = builder.currentEpochTime();
                    user.save();
                    response(err, user);
                  });
                });
              });
              async.series(calls, function(err, resp) {
                res.send(organization);
              });
            });
          });
        });
      });
    });
  } else {
    res.send('error');
  }
};

exports.postNewAdminHelpInstance = function(req, res) {
  var data = req.body;
  if (data.classInstance && data.dueDate) {
    var helpInstance = new HelpInstance({
      classInstance: data.classInstance,
      users: [data.user],
      dueDate: data.dueDate,
      requested: true
    });
    helpInstance.save(function(err) {
      User.findById(data.user, function(err, user){
        if (!err && user) {
          user.helpInstances.unshift(helpInstance.id);
          user.updatedAt = builder.currentEpochTime();
          user.save();
        }
      });
      res.send(helpInstance);
    });
  } else {
    res.send('error');
  }
};

exports.postNewHelpInstance = function(req, res) {
  var data = req.body;
  if (data.helpType && data.user && data.completedDate && data.description
    && ((data.helpType == "0" && data.hours)
      || (data.helpType == "1" && data.websiteID))) {
    var users = [];
    if (data.helpingUsers) {
      users = data.helpingUsers;
    }
    users.unshift(data.user);
    var weekOf = data.completedDate;
    HelpInstance.find({
      classInstance: (data.classInstance || ''),
      users: users
    }).exec(function(err, helpInstances) {
      var helpInstance = helpInstance = new HelpInstance({
        users: users
      });
      if (data.classInstance && data.classInstance != '') {
        helpInstance.classInstance = data.classInstance;
      }
      helpInstance.helpType = data.helpType;
      builder.arrayToObjects(User, users, function(err, usersObject) {
        usersObject.forEach(function(user) {
          user.helpInstances.unshift(helpInstance.id);
          user.updatedAt = builder.currentEpochTime();
          user.save();
        });
      });
      helpInstance.completed = true;
      helpInstance.description = data.description;
      helpInstance.completedDate = data.completedDate;
      if (data.helpType == 0) {
        helpInstance.hours = data.hours;
      } else if (data.helpType == 1) {
        helpInstance.websiteID = data.websiteID;
      }
      helpInstance.save(function(err) {
        res.send(helpInstance);
      });
    });
  } else {
    res.send('error');
  }
};

exports.postNewSemester = function(req, res) {
  var data = req.body;
  if (data.semesterContainer && data.year) {
    builder.createSemester(data, function(err, semester) {
      res.send(semester);
    });
  } else {
    res.send('error');
  }
};

exports.postNewClassInstance = function(req, res) {
  var data = req.body;
  if (data.semester && data.classCode && data.classIdentifier && data.classCredits) {
    Organization.findById(req.user.organization, function(err, organization) {
      if (!err && organization) {
        Semester.findById(data.semester, function(err, semester) {
          if (!err && semester) {
            Class.findOne({
              classCode: data.classCode,
              classIdentifier: data.classIdentifier,
              organization: organization.id,
              classCredits: data.classCredits
            }).exec(function(err, fClass) {
              if (!err && fClass) {
                fClass.users.unshift(data.user);
                fClass.updatedAt = builder.currentEpochTime();
              } else {
                fClass = new Class({
                  classCode: data.classCode,
                  classIdentifier: data.classIdentifier,
                  users: [data.user],
                  organization: organization.id,
                  classCredits: data.classCredits
                });
              }
              fClass.save(function(err) {
                if (organization.classes.indexOf(fClass.id) == -1) {
                  organization.classes.unshift(fClass.id);
                }
                var classInstance = new ClassInstance({
                  user: req.user.id,
                  semester: semester.id,
                  class: fClass.id,
                  organization: organization.id
                });
                classInstance.save(function(err) {
                  organization.classInstances.unshift(classInstance.id);
                  organization.updatedAt = builder.currentEpochTime();
                  organization.save();
                  semester.classInstances.unshift(classInstance.id);
                  semester.updatedAt = builder.currentEpochTime();
                  semester.save();
                  fClass.classInstances.unshift(classInstance.id);
                  fClass.updatedAt = builder.currentEpochTime();
                  fClass.save();
                  if(req.user.semesters.indexOf(semester.id) == -1) {
                    req.user.semesters.unshift(semester.id);
                  }
                  if(req.user.classes.indexOf(fClass.id) == -1) {
                    req.user.classes.unshift(fClass.id);
                  }
                  req.user.classInstances.unshift(classInstance.id);
                  req.user.updatedAt = builder.currentEpochTime();
                  req.user.save();
                  res.send(classInstance);
                });
              });
            });
          } else {
            res.send('error');
          }
        });
      } else {
        res.send('error');
      }
    });
  } else {
    res.send('error');
  }
};

exports.getInvitedUsers = function(req, res) {
  var data = req.query;
  if (data.organization) {
    if (data.organization == req.user.organization) {
      Organization.findById(data.organization, function(err, organization) {
        if (!err && organization) {
          var inviteUsers = [];
          organization.invitedUsers.forEach(function(inviteUser, index) {
            inviteUsers.unshift({
              email: inviteUser,
              status: organization.invitedUserStatuses[index]
            });
          });
          res.send(inviteUsers);
        } else {
          res.send('error');
        }
      });
    } else {
      res.send('error');
    }
  } else {
    res.send('error');
  }
};

exports.sendTestMail = function(req, res) {
  var data = req.body;
  if (data.organization) {
    if (req.user.organization == data.organization) {
      broadcast.testMail(data.organization, req.user.email, req.user.displayName, function(err, resp) {
        if (!err) {
          res.send('ok');
        } else {
          res.send('error');
        }
      });
    }
  }
};

exports.getActiveUsers = function(req, res) {
  var data = req.query;
  if (data.organization) {
    if (req.user.organization == data.organization) {
      Organization.findById(data.organization, function(err, organization) {
        if (!err && organization) {
          builder.arrayToObjects(User, organization.users, function(err, users) {
            var activeUsers = [];
            users.forEach(function(user) {
              if (user.isActive) {
                activeUsers.unshift(user);
              }
            });
            res.send(activeUsers);
          });
        } else {
          res.send('error');
        }
      });
    } else {
      res.send('error');
    }
  } else {
    res.send('error');
  }
};

exports.postNewReport = function(req, res) {
  var data = req.body;
  if (data.fields && data.index && data.reportFrequency) {
    builder.currentUserSemester({user: data.user}, function(err, currentSemester, currentSC) {
      if (!err && currentSemester) {
        var report = new Report({
          fieldLabels: data.fieldLabels,
          fields: data.fields,
          index: data.index,
          reportFrequency: data.reportFrequency,
          user: data.user,
          semester: currentSemester.id
        });
        report.save(function(err) {
          req.user.reports.unshift(report.id);
          req.user.updatedAt = builder.currentEpochTime();
          req.user.save();
          Semester.findById(currentSemester.id, function(err, semester) {
            if (!err && semester) {
              semester.reports.unshift(report.id);
              semester.updatedAt = builder.currentEpochTime();
              semester.save();
              res.send(report);
            } else {
              res.send('error');
            }
          });
        });
      } else {
        res.send('error');
      }
    });
  } else {
    res.send('error');
  }
}

exports.postNewCategory = function(req, res) {
  var data = req.body;
  if (data.organization && data.label && data.minimumGPA && data.maximumGPA) {
    if (req.user.organization == data.organization) {
      Organization.findById(data.organization, function(err, organization) {
        if (!err && organization) {
          var category = new Category({
            organization: organization.id,
            label: data.label,
            minimumGPA: data.minimumGPA,
            maximumGPA: data.maximumGPA
          });
          if (data.description) {
            category.description = data.description;
          }
          if (data.minimumStudyHours) {
            category.minimumStudyHours = data.minimumStudyHours;
          }
          if (data.studyHoursRequired) {
            category.studyHoursRequired = data.studyHoursRequired == 'true';
          }
          if (data.reportsRequired) {
            category.reportsRequired = data.reportsRequired == 'true';
          }
          if (data.reportFrequency) {
            category.reportFrequency = data.reportFrequency;
          }
          category.save(function(err) {
            organization.categories.unshift(category.id);
            organization.updatedAt = builder.currentEpochTime();
            organization.save();
            res.send(category);
          });
        } else {
          res.send('error');
        }
      });
    } else {
      res.send('error');
    }
  } else {
    res.send('error');
  }
};

exports.dropCategory = function(req, res) {
  var data = req.body;
  if (data.organization && data.category) {
    if (req.user.organization == data.organization) {
      Category.findById(data.category, function(err, category) {
        if (!err && category) {
          category.isActive = false;
          category.updatedAt = builder.currentEpochTime();
          category.save(function(err) {
            res.send(category);
          });
        } else {
          res.send('error');
        }
      });
    } else {
      res.send('error');
    }
  } else {
    res.send('error');
  }
};

exports.getCategories = function(req, res) {
  var data = req.query;
  if (data.organization) {
    if (req.user.organization == data.organization) {
      Organization.findById(data.organization, function(err, organization) {
        if (!err && organization) {
          builder.arrayToObjects(Category, organization.categories, function(err, categories) {
            var output = [];
            categories.forEach(function(category) {
              if (category.isActive) {
                output.unshift(category);
              }
            });
            res.send(output);
          });
        } else {
          res.send('error');
        }
      });
    } else {
      res.send('error');
    }
  } else {
    res.send('error');
  }
};

exports.addReportField = function(req, res) {
  var data = req.body;
  if (data.organization && data.reportField) {
    if (req.user.organization == data.organization) {
      Organization.findById(data.organization, function(err, organization) {
        if (!err && organization) {
          organization.reportFields.push(data.reportField);
          organization.updatedAt = builder.currentEpochTime();
          organization.save(function(err) {
            res.send(organization);
          });
        } else {
          res.send('error');
        }
      });
    } else {
      res.send('error');
    }
  } else {
    res.send('error');
  }
};

exports.setReportFields = function(req, res) {
  var data = req.body;
  if (data.organization && data.reportFields) {
    if (req.user.organization == data.organization) {
      Organization.findById(data.organization, function(err, organization) {
        if (!err && organization) {
          organization.reportFields = data.reportFields;
          organization.updatedAt = builder.currentEpochTime();
          organization.save(function(err) {
            res.send(organization);
          });
        } else {
          res.send('error');
        }
      });
    } else {
      res.send('error');
    }
  } else {
    res.send('error');
  }
};

exports.getReportFields = function(req, res) {
  var data = req.query;
  if (data.organization) {
    if (req.user.organization == data.organization) {
      Organization.findById(data.organization, function(err, organization) {
        if (!err && organization) {
          res.send(organization.reportFields);
        } else {
          res.send('error');
        }
      });
    } else {
      res.send('error');
    }
  } else {
    res.send('error');
  }
};

exports.inviteUsers = function(req, res) {
  var data = req.body;
  if (data.users && data.organization && data.sendInvites) {
    if (req.user.organization == data.organization) {
      Organization.findById(data.organization, function(err, organization) {
        if (!err && organization) {
          var users = data.users.split(',');
          var addUsers = [];
          var addInviteStatus = [];
          prefs.broadcastEmailVerified(organization.id, function(err, canSendEmails) {
            var sendInvites = (data.sendInvites == 'true' && canSendEmails);
            var broadcastUsers = [];
            users.forEach(function(user) {
              if (organization.invitedUsers.indexOf(user) == -1) {
                organization.invitedUsers.unshift(user);
                organization.invitedUserStatuses.unshift(sendInvites);
              }
            });
            if (sendInvites) {
              broadcast.inviteMail(organization.id, req.user.displayName, users, function(err, response) {});
            }
            organization.updatedAt = builder.currentEpochTime();
            organization.save(function(err) {
              res.send(organization);
            });
          });
        } else {
          res.send('error');
        }
      });
    } else {
      res.send('error');
    }
  } else {
    res.send('error');
  }
};

// exports.getById = function(req, res){
//   if (req.params[0] == req.user._id) {
//     res.render('user', { user: req.user });
//   } else if (req.user.isAdmin) {
//     User.findById(req.params[0], function(err, user) {
//       res.render('user', { user: user, isNotUser: true });
//     });
//   } else {
//     res.redirect('/user');
//   }
// };
