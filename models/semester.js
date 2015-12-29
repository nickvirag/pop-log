var ClassInstance = require('./classinstance.js');
var mongoose = require('mongoose');
var async = require('async');

var semesterSchema = new mongoose.Schema({
  createdAt: {
    type: Number,
    default: Date.now
  },
  updatedAt: {
    type: Number,
    default: Date.now
  },
  trimester: Number,
  year: Number,
  user: {
    type: Number
  },
  classInstances: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    default: []
  }]
});

module.exports = mongoose.model('Semester', semesterSchema);
