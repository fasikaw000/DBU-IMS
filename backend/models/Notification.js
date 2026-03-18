const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['INFO', 'WARNING', 'DEADLINE', 'APPROVAL', 'FEEDBACK', 'SYSTEM'],
    default: 'INFO'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  actionUrl: {
    type: String // Optional URL to redirect the user (e.g., /reports/123)
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
