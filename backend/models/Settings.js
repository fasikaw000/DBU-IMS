import mongoose from 'mongoose';

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
    defaultInternshipDurationMonths: { type: Number, default: 3 },
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
