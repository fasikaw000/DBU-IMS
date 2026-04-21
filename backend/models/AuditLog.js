import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  action: {
    type: String,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  targetResource: {
    model: String,
    documentId: mongoose.Schema.Types.ObjectId
  },
  ip: String,
  userAgent: String,
  details: String
}, {
  timestamps: true
});

export default mongoose.model('AuditLog', auditLogSchema);
