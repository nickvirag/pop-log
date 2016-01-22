var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
  createdAt: {
    type: Number,
    default: Date.now
  },
  updatedAt: {
    type: Number,
    default: Date.now
  },
  firstName: String,
  lastName: String,
  displayName: String,
  email: String,
  googleID: Number,
  isActive: {
    type: Boolean,
    default: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  classes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    default: []
  }],
  classInstances: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassInstance',
    default: []
  }],
  helpInstances: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HelpInstance',
    default: []
  }],
  semesters: [{
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

module.exports = mongoose.model('User', userSchema);
