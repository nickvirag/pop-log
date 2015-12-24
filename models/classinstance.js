var mongoose = require('mongoose');

var classInstanceSchema = new mongoose.Schema({
  createdAt: {
    type: Number,
    default: Date.now
  },
  updatedAt: {
    type: Number,
    default: Date.now
  },
  grade: {
    type: Number,
    default: 0
  },
  isEnrolled: {
    type: Boolean,
    default: true
  },
  user: {
    type: Number
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester'
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }
});

module.exports = mongoose.model('ClassInstance', classInstanceSchema);
