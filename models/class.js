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
  displayName: {
    type: String,
    default: ''
  },
  users: [{
    type: Number,
    default: []
  }],
  classInstances: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassInstance',
    default: []
  }]
});

module.exports = mongoose.model('Class', classSchema);
