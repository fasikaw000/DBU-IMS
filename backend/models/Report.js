const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  internship: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Internship',
    required: true
  },
  type: {
    type: String,
    enum: ['WEEKLY', 'MONTHLY', 'FINAL'],
    required: true
  },
  fileUrl: {
    type: String,
    required: [true, 'Please provide the Cloudinary file URL']
  },
  version: {
    type: Number,
    default: 1
  },
  isLatest: {
    type: Boolean,
    default: true
  },
  submissionDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  isLate: {
    type: Boolean,
    default: false // This will be calculated on .save() middleware
  },
  feedback: {
    comment: String,
    advisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dateAdded: Date
  },
  approved: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Middleware to calculate isLate prior to saving
reportSchema.pre('save', function(next) {
  if (this.submissionDate > this.dueDate) {
    this.isLate = true;
  } else {
    this.isLate = false;
  }
  next();
});

module.exports = mongoose.model('Report', reportSchema);
