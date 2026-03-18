const mongoose = require('mongoose');

const logbookSchema = new mongoose.Schema({
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
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  activity: {
    type: String,
    required: [true, 'Please describe your activity'],
    trim: true
  },
  hoursWorked: { // Optional extra field typical in logbooks
    type: Number,
    min: 0,
    max: 24
  },
  comment: { // Advisor's comment on the daily/weekly log
    text: String,
    advisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dateAdded: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Logbook', logbookSchema);
