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
    advisorGrade: { type: Number, min: 0, max: 100 },
    advisorScore: { type: Number, min: 0, max: 100 },
    companyGrade: { type: Number, min: 0, max: 100 },
    projectGrade: { type: Number, min: 0, max: 100 },
    documentationGrade: { type: Number, min: 0, max: 100 },
    implementationGrade: { type: Number, min: 0, max: 100 },
    presentationGrade: { type: Number, min: 0, max: 100 },
    total: { type: Number, min: 0, max: 100 },
    letterGrade: { type: String, trim: true },
    gradePoint: { type: Number, min: 0, max: 4 },
    status: { type: String, trim: true },
    description: { type: String, trim: true }
  }
}, {
  timestamps: true // Tracks exactly when the internship transitions state
});

export default mongoose.model('Internship', internshipSchema);
