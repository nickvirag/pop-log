var mongoose = require('mongoose');

var classSchema = new mongoose.Schema({
  createdAt: {
    type: Number,
    default: Date.now
  },
  updatedAt: {
    type: Number,
    default: Date.now
  },
  classCode: String,
  classIdentifier: Number,
  classCredits: {
    type: Number,
    default: 0
  },
  displayName: {
    type: String,
    default: ''
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization'
  },
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }],
  classInstances: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassInstance',
    default: []
  }]
});

module.exports = mongoose.model('Class', classSchema);
