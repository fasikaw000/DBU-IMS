import mongoose from 'mongoose';

const validStudentIdSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true
  },
  isRegistered: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'authorizedStudentIds'
});

export default mongoose.model('ValidStudentId', validStudentIdSchema);
