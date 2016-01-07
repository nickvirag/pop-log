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

var builder = require('../helpers/builder');
var prefs = require('../helpers/prefs');
var dateFormat = require('dateformat');

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
  if (data.user) {
    if (req.user.id == data.user) {
      User.findById(data.user, function(err, user) {
        if (!err && user) {
          builder.arrayToObjects(HelpInstance, user.helpInstances, function(err, helpInstances) {
            var logs = [];
            var lastSunday = new Date();
            lastSunday.setDate(lastSunday.getDate() - lastSunday.getDay());
            lastSunday.setHours(0, 0, 0, 0);
            helpInstances.forEach(function(helpInstance) {
              var date = new Date(helpInstance.completedDate * 1000);
              lastSunday.setHours(0, 0, 0, 0);
              logs.unshift({
                completedDate: dateFormat(date, prefs.getDateFormat()),
                day: dateFormat(date, 'dddd'),
                class: helpInstance.classInstance,
                description: builder.helpInstanceText(helpInstance)
              });
            });
            res.send(logs);
          });
        } else {
          res.send('error');
        }
      });
    } else {
      res.send('user mismatch error');
    }
  } else {
    res.send('missing parameters error');
  }
}

exports.postNewAdminHelpInstance = function(req, res) {
  /*
  createdAt, updatedAt, requested, completed, hours, websiteTitle, websiteURL, description, helpType, dueDate, completedDate, classInstance, users
  */
  var data = req.body;
  if (data.classInstance && data.user && data.dueDate) {
    var helpInstance = new HelpInstance({
      classInstance: data.classInstance,
      user: data.user,
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
}

exports.postNewHelpInstance = function(req, res) {
  var data = req.body;
  if (data.helpType && data.classInstance && data.user && data.completedDate && data.description
    && ((data.helpType == 0 && data.hours)
      || (data.helpType == 1 && data.websiteID))) {
    var weekOf = data.completedDate;
    HelpInstance.find({
      classInstance: data.classInstance,
      user: data.user
    }).exec(function(err, helpInstances) {
      var helpInstance = null;
      if (!err && helpInstances) {
        var timeDistance = Number.MAX_SAFE_INTEGER;
        helpInstances.forEach(function(readHelpInstance) {
          if (readHelpInstance.dueDate) {
            var differenceTravel = readHelpInstance.dueDate - data.completedDate;
            var seconds = Math.floor((differenceTravel) / (1000));
            if (distanceTravel >= 0 && distanceTravel <= 604800 && differenceTravel < timeDistance) {
              helpInstance = readHelpInstance;
              timeDistance = differenceTravel;
            }
          }
        });
      }
      if (helpInstance === null) {
        helpInstance = new HelpInstance({
          classInstance: data.classInstance,
          user: data.user
        });
      }
      helpInstance.save(function(err) {
        User.findById(data.user, function(err, user){
          if (!err && user) {
            user.helpInstances.unshift(helpInstance.id);
            user.updatedAt = builder.currentEpochTime();
            user.save();
          }
        });
      });
      helpInstance.helpType = data.helpType;
      if (data.helpingUsers) {
        helpInstance.helpingUsers = data.helpingUsers;
        builder.arrayToObjects(User, data.helpingUsers, function(err, users) {
          users.forEach(function(user) {
            user.helpUserInstances.unshift(helpInstance.id);
            user.updatedAt = builder.currentEpochTime();
            user.save();
          });
        });
      }
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

exports.postNewClassInstance = function(req, res){
  var data = req.body;
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
