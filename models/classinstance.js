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
  dropExcuse: {
    type: String,
    default: ''
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    default: null
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    default: null
  },
  helpInstances: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HelpInstance',
    default: []
  }]
});

module.exports = mongoose.model('ClassInstance', classInstanceSchema);
