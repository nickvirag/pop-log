var mongoose = require('mongoose');

var semesterContainerSchema = new mongoose.Schema({
  createdAt: {
    type: Number,
    default: Date.now
  },
  updatedAt: {
    type: Number,
    default: Date.now
  },
  label: String,
  startMonth: Number,
  startDay: Number,
  endMonth: Number,
  endDay: Number,
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  semesters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    default: []
  }]
});

module.exports = mongoose.model('SemesterContainer', semesterContainerSchema);
