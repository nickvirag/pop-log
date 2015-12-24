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
    ref: 'Class'
  }],
  classInstances: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassInstance'
  }],
  semesters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester'
  }],
  _id: Number
});

module.exports = mongoose.model('User', userSchema);
