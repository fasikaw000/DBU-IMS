import mongoose from 'mongoose';

const gradingRuleSchema = new mongoose.Schema({
  minScore: { type: Number, required: true, min: 0, max: 100 },
  maxScore: { type: Number, required: true, min: 0, max: 100 },
  letterGrade: { type: String, required: true, trim: true },
  gradePoint: { type: Number, required: true, min: 0, max: 4 },
  status: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true }
}, { _id: false });

const defaultGradingSystem = [
  { minScore: 90, maxScore: 100, letterGrade: 'A+', gradePoint: 4.0, status: 'Excellent', description: 'Outstanding performance' },
  { minScore: 85, maxScore: 89, letterGrade: 'A', gradePoint: 4.0, status: 'Excellent', description: 'Excellent performance' },
  { minScore: 80, maxScore: 84, letterGrade: 'A-', gradePoint: 3.75, status: 'Excellent', description: 'Strong and consistent performance' },
  { minScore: 75, maxScore: 79, letterGrade: 'B+', gradePoint: 3.5, status: 'Very Good', description: 'Very good achievement' },
  { minScore: 70, maxScore: 74, letterGrade: 'B', gradePoint: 3.0, status: 'Very Good', description: 'Good overall achievement' },
  { minScore: 65, maxScore: 69, letterGrade: 'B-', gradePoint: 2.75, status: 'Good', description: 'Above satisfactory performance' },
  { minScore: 60, maxScore: 64, letterGrade: 'C+', gradePoint: 2.5, status: 'Good', description: 'Satisfactory with notable gaps' },
  { minScore: 50, maxScore: 59, letterGrade: 'C', gradePoint: 2.0, status: 'Satisfactory', description: 'Minimum satisfactory standard' },
  { minScore: 45, maxScore: 49, letterGrade: 'C-', gradePoint: 1.75, status: 'Unsatisfactory', description: 'Below minimum expectation' },
  { minScore: 40, maxScore: 44, letterGrade: 'D', gradePoint: 1.0, status: 'Very Poor', description: 'Very weak performance' },
  { minScore: 30, maxScore: 39, letterGrade: 'Fx', gradePoint: 0, status: 'Fail (Re-exam)', description: 'Failed; re-exam required' },
  { minScore: 0, maxScore: 29, letterGrade: 'F', gradePoint: 0, status: 'Fail (Repeat course)', description: 'Failed; course must be repeated' }
];

const settingsSchema = new mongoose.Schema({
  systemName: {
    type: String,
    default: 'DBU Internship Management System'
  },
  logo: {
    type: String,
    default: '/logo.png'
  },
  passwordPolicy: {
    minLength: { type: Number, default: 8 },
    requireSpecialChar: { type: Boolean, default: true }
  },
  emailSettings: {
    smtpHost: { type: String, default: 'smtp.gmail.com' },
    smtpPort: { type: Number, default: 587 },
    email: { type: String, default: '' },
    appPassword: { type: String, default: '' } // Secured in real env
  },
  academicSettings: {
    defaultInternshipDurationMonths: { type: Number, default: 2 },
    gradingSystem: {
      type: [gradingRuleSchema],
      default: defaultGradingSystem
    },
    gradingScale: {
      A: { type: Number, default: 85 },
      B: { type: Number, default: 75 },
      C: { type: Number, default: 60 },
      Pass: { type: Number, default: 50 }
    }
  },
  securitySettings: {
    sessionTimeoutMinutes: { type: Number, default: 15 },
    loginAttemptLimit: { type: Number, default: 5 }
  }
}, {
  timestamps: true
});

export default mongoose.model('Settings', settingsSchema);
