const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true // e.g., 'APPROVED_INTERNSHIP', 'ASSIGNED_GRADE'
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetResource: {
    model: {
      type: String, // e.g., 'Internship', 'User' 
      required: true
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    }
  },
  details: {
    type: mongoose.Schema.Types.Mixed // JSON object for extra diffs or states
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
