var express = require('express');
var passport = require('passport');
var router = express.Router();

var app = express();

var mongoose = require('mongoose');
mongoose.set('debug', true);

var User = require('../models/user.js');
var Semester = require('../models/semester.js');
var ClassInstance = require('../models/classinstance.js');
var Class = require('../models/class.js');
var User = require('../models/user.js');

var builder = require('../helpers/builder');
var prefs = require('../helpers/prefs');

exports.updateClassInstance = function(req, res){
  var data = req.body;
  if (data.grade && data.id) {
    ClassInstance.findById(data.id, function(err, classInstance) {
      if (!err && classInstance) {
        if (classInstance.user == req.user.id) {
          classInstance.grade = data.grade;
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

exports.dropClassInstance = function(req, res){
  var data = req.body;
  if (data.excuse && data.id) {
    ClassInstance.findById(data.id, function(err, classInstance) {
      if (!err && classInstance) {
        if (classInstance.user == req.user.id) {
          classInstance.isEnrolled = false;
          classInstance.dropExcuse = data.dropExcuse;
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

exports.getClassHelp = function(req, res) {
  var data = req.query;
  console.log(req);
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
          semester.save();
          fClass.classInstances.unshift(classInstance.id);
          fClass.save();
          if(req.user.semesters.indexOf(semester.id) == -1) {
            req.user.semesters.unshift(semester.id);
          }
          if(req.user.classes.indexOf(fClass.id) == -1) {
            req.user.classes.unshift(fClass.id);
          }
          req.user.classInstances.unshift(classInstance.id);
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
        console.log('err: ' + err + '\nsemester: ' + semester);
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
