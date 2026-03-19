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
  timestamps: true
});

export default mongoose.model('ValidStudentId', validStudentIdSchema);
