var mongoose = require('mongoose');

var semesterSchema = new mongoose.Schema({
  createdAt: {
    type: Number,
    default: Date.now
  },
  updatedAt: {
    type: Number,
    default: Date.now
  },
  trimesterLabel: String,
  year: Number,
  reportedGPA: {
    type: Number,
    default: 0.00
  },
  semesterContainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SemesterContainer'
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  classInstances: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    default: []
  }],
  reports: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    default: []
  }]
});

module.exports = mongoose.model('Semester', semesterSchema);
