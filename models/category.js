var mongoose = require('mongoose');

var categorySchema = new mongoose.Schema({
  createdAt: {
    type: Number,
    default: Date.now
  },
  updatedAt: {
    type: Number,
    default: Date.now
  },
  label: String,
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  minimumGPA: Number,
  maximumGPA: Number,
  minimumStudyHours: {
    type: Number,
    default: 0
  },
  studyHoursRequired: {
    type: Boolean,
    default: false
  },
  reportsRequired: {
    type: Boolean,
    default: false
  },
  reportFrequency: {
    type: Number,
    default: 0
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization'
  }
});

module.exports = mongoose.model('Category', categorySchema);
