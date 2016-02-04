var mongoose = require('mongoose');

var reportSchema = new mongoose.Schema({
  createdAt: {
    type: Number,
    default: Date.now
  },
  updatedAt: {
    type: Number,
    default: Date.now
  },
  fieldLabels: [String],
  fields: [String],
  index: Number,
  reportFrequency: Number,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester'
  }
});

module.exports = mongoose.model('Report', reportSchema);
