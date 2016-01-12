var express = require('express');
var passport = require('passport');
var router = express.Router();

var app = express();

var mongoose = require('mongoose');
mongoose.set('debug', true);

var User = require('../models/user.js');
var Semester = require('../models/semester.js');
var ClassInstance = require('../models/classinstance.js');
var HelpInstance = require('../models/helpinstance.js');
var Class = require('../models/class.js');
var Organization = require('../models/organization.js');

var builder = require('../helpers/builder');
var prefs = require('../helpers/prefs');
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
}

exports.getSemester = function(req, res) {
  var data = req.query;
  builder.getJSONSemester(data, function(err, response){
    res.send(response);
  });
};

exports.getSemesters = function(req, res) {
  var data = req.query;
  if (data.user) {
    if (data.user == req.user.id) {
      var calls = [];
      req.user.semesters.forEach(function(semester) {
        calls.push(function(response) {
          builder.getJSONSemester({
              user: req.user,
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
    } else {
      res.send('error');
    }
  } else {
    res.send('error');
  }
}

exports.getClassHelp = function(req, res) {
  var data = req.query;
  if (data.id && data.user) {
    if (req.user.id == data.user) {
      ClassInstance.findById(data.id, function(err, classInstance) {
        if (!err && classInstance) {
          Class.findById(classInstance.class, function(err, fClass) {
            if (!err && fClass) {
              var helpObject = {};
              helpObject.users = [];
              helpObject.websites = prefs.getHelpWebsites();
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
      res.send('user mismatch error');
    }
  } else {
    res.send('missing parameters error');
  }
};

exports.getLogs = function(req, res) {
  var data = req.query;
  builder.getJSONLogs(req.user, data, function(err, response){
    res.send(response);
  });
};

exports.joinOrganization = function(req, res) {
  var data = req.body;
  if (data.organization && data.user) {
    if (req.user.id == data.user) {
      Organization.findById(data.organization, function(err, organization) {
        if (!err && organization) {
          req.user.organization = organization._id;
          req.user.updatedAt = builder.currentEpochTime();
          req.user.save();
          organization.users.unshift(req.user.id);
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
  } else {
    res.send('error');
  }
};

exports.postNewOrganization = function(req, res) {
  var data = req.body;
  if (data.displayName && data.location && data.user) {
    if (req.user.id == data.user) {
      var admins = data.admins ? data.admins.split(',') : [];
      admins.push(data.user);
      var organization = new Organization({
        displayName: data.displayName,
        admins: admins,
        location: data.location
      });
      if (data.designation) {
        organization.designation = data.designation;
      }
      if (data.memberLabel) {
        organization.memberLabel = data.memberLabel;
      }
      if (data.classGrades) {
        organization.classGrades = data.classGrades.split(',');
      }
      if (data.classTypes) {
        organization.classGrades = data.classTypes.split(',');
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
    } else {
      res.send('error');
    }
  } else {
    res.send('error');
  }
};

exports.postNewAdminHelpInstance = function(req, res) {
  var data = req.body;
  if (data.classInstance && data.user && data.dueDate) {
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
      var helpInstance = null;
      // if (!err && helpInstances) {
      //   var timeDistance = Number.MAX_SAFE_INTEGER;
      //   helpInstances.forEach(function(readHelpInstance) {
      //     if (readHelpInstance.dueDate) {
      //       var differenceTravel = readHelpInstance.dueDate - data.completedDate;
      //       var seconds = Math.floor((differenceTravel) / (1000));
      //       if (distanceTravel >= 0 && distanceTravel <= 604800 && differenceTravel < timeDistance) {
      //         helpInstance = readHelpInstance;
      //         timeDistance = differenceTravel;
      //       }
      //     }
      //   });
      // }
      // if (helpInstance === null) {
        helpInstance = new HelpInstance({
          users: users
        });
        if (data.classInstance && data.classInstance != '') {
          helpInstance.classInstance = data.classInstance;
        }
      // }
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
}

exports.postNewSemester = function(req, res) {
  var data = req.body;
  if (data.user && data.trimester && data.year) {
    if (data.user == req.user.id) {
      Semester.findOne({
        user: data.user,
        trimester: data.trimester,
        year: data.year
      }).exec(function(err, semester) {
        if (!err && semester) {
          res.send('error');
        } else {
          var semester = new Semester({
            user: data.user,
            trimester: data.trimester,
            year: data.year
          });
          semester.save(function(err) {
            req.user.semesters.unshift(semester.id);
            req.user.updatedAt = builder.currentEpochTime();
            req.user.save();
            res.send(semester);
          });
        }
      });
    } else {
      res.send('error');
    }
  } else {
    res.send('error');
  }
}

exports.postNewClassInstance = function(req, res){
  var data = req.body;
  console.log(data);
  console.log(data.trimester && data.year && data.classCode && data.classIdentifier && data.user);
  if (data.trimester && data.year && data.classCode && data.classIdentifier && data.user) {
    if (req.user.id == data.user) {
      var createWithSemesterAndClass = function(semester, fClass) {
        var classInstance = new ClassInstance({
          user: req.user.id,
          semester: semester.id,
          class: fClass.id
        });
        classInstance.save(function(err, newClassInstance){
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
      };
      var createWithSemester = function(semester) {
        Class.findOne({
          classCode: data.classCode,
          classIdentifier: data.classIdentifier
        }).exec(function(err, fClass) {
          if (!err && fClass) {
            fClass.users.unshift(data.user);
            fClass.updatedAt = builder.currentEpochTime();
            fClass.save();
            createWithSemesterAndClass(semester, fClass);
          } else {
            fClass = new Class({
              classCode: data.classCode,
              classIdentifier: data.classIdentifier,
              users: [data.user]
            });
            fClass.save(function(err, nfClass) {
              createWithSemesterAndClass(semester, fClass);
            });
          }
        });
      };
      Semester.findOne({
        user: req.user.id,
        trimester: data.trimester,
        year: data.year
      }).exec(function(err, semester) {
        if (!err && semester) {
          createWithSemester(semester);
        } else {
          semester = new Semester({
            user: req.user.id,
            trimester: data.trimester,
            year: data.year
          });
          semester.save(function(err, sem) {
            createWithSemester(semester);
          });
        }
      });
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
