import mongoose from 'mongoose';

const internshipSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    unique: true // A student can only have 1 active internship workflow
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  field: {
    type: String,
    required: [true, 'Internship field is required (e.g., Web Dev, Cybersecurity)']
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  companySupervisorName: {
    type: String,
    required: true
  },
  companySupervisorEmail: {
    type: String,
    required: false
  },
  companySupervisorPhone: {
    type: String,
    required: true
  },
  advisor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Links to University Advisor
  },
  companyEvaluationUrl: {
    type: String
  },
  presentationCompleted: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['NOT_STARTED', 'PENDING_APPROVAL', 'APPROVED', 'ONGOING', 'SUBMITTED', 'EVALUATED', 'COMPLETED'],
    default: 'NOT_STARTED'
  },
  finalGrade: {
    advisorGrade: { type: Number, min: 0, max: 100 }, // Weight: 40%
    companyGrade: { type: Number, min: 0, max: 100 }, // Weight: 30%
    projectGrade: { type: Number, min: 0, max: 100 }, // Weight: 30%
    total: { type: Number, min: 0, max: 100 }
  }
}, {
  timestamps: true // Tracks exactly when the internship transitions state
});

export default mongoose.model('Internship', internshipSchema);
