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
  minimumGPA: Number,
  maximumGPA: Number,
  minimumStudyHours: {
    type: Number,
    default: 0
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
