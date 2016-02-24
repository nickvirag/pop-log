var mongoose = require('mongoose');

var organizationSchema = new mongoose.Schema({
  createdAt: {
    type: Number,
    default: Date.now
  },
  updatedAt: {
    type: Number,
    default: Date.now
  },
  location: String,
  displayName: String,
  hoursDueDay: {
    type: Number,
    default: 0
  },
  hoursDueMinutes: {
    type: Number,
    default: 0
  },
  emailUsername: {
    type: String,
    default: ''
  },
  emailPassword: {
    type: String,
    default: ''
  },
  designation: {
    type: String,
    default: ''
  },
  security: {
    type: Number,
    default: 0
  },
  allowedDomains: [{
    type: String,
    default: []
  }],
  blockedDomains: [{
    type: String,
    default: []
  }],
  allowedAddresses: [{
    type: String,
    default: []
  }],
  reportFields: [{
    type: String,
    default: []
  }],
  memberLabel: {
    type: String,
    default: 'member'
  },
  memberLabelPlural: {
    type: String,
    default: 'members'
  },
  gradesEnabled: {
    type: Boolean,
    default: true
  },
  libraryEnabled: {
    type: Boolean,
    default: true
  },
  hoursEnabled: {
    type: Boolean,
    default: true
  },
  categoriesEnabled: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  classTypes: [{
    type: String,
    default: []
  }],
  classGrades: [{
    type: String,
    default: []
  }],
  invitedUsers: [{
    type: String,
    default: []
  }],
  invitedUserStatuses: [{
    type: Boolean,
    default: []
  }],
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }],
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }],
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
  semesterContainers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SemesterContainer',
    default: []
  }],
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: []
  }]
});

module.exports = mongoose.model('Organization', organizationSchema);
