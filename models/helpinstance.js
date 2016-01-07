var mongoose = require('mongoose');

var helpInstanceSchema = new mongoose.Schema({
  createdAt: {
    type: Number,
    default: Date.now
  },
  updatedAt: {
    type: Number,
    default: Date.now
  },
  requested: {
    type: Boolean,
    default: false
  },
  completed: {
    type: Boolean,
    default: false
  },
  hours: {
    type: Number,
    default: 0
  },
  websiteID: {
    type: Number,
    default: null
  },
  description: {
    type: String,
    default: ''
  },
  helpType: {
    type: Number,
    default: null
  },
  dueDate: {
    type: Number,
    default: null
  },
  completedDate: {
    type: Number,
    default: null
  },
  classInstance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassInstance',
    default: null
  },
  users: [{
    type: Number
  }]
});

helpInstanceSchema.method('generateDescription', function() {
  return this.ClassInstance;
});

module.exports = mongoose.model('HelpInstance', helpInstanceSchema);
