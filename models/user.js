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
  reportedGPA: {
    type: Number,
    default: 0.00
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isAdmin: {
    type: Boolean,
    default: false
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
  helpUserInstances: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HelpInstance',
    default: []
  }],
  semesters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    default: []
  }],
  _id: Number
});

module.exports = mongoose.model('User', userSchema);
