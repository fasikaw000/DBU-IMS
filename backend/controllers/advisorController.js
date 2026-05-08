import Student from '../models/Student.js';
import Internship from '../models/Internship.js';
import Report from '../models/Report.js';
import Evaluation from '../models/Evaluation.js';
import Logbook from '../models/Logbook.js';
import AuditLog from '../models/AuditLog.js';
import Settings from '../models/Settings.js';
import { checkAndCompleteInternship } from './internshipController.js';

const getDefaultGradingSystem = () => ([
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
]);

const mapScoreToGrade = (score, gradingRules) => {
  const numericScore = Number(score);
  const rule = gradingRules.find((item) => numericScore >= item.minScore && numericScore <= item.maxScore);
  return rule || null;
};

// ─────────────────────────────────────────────────────────────
// @desc    Get advisor's assigned students
// @route   GET /api/advisor/students
// @access  Private (Advisor)
// ─────────────────────────────────────────────────────────────
export const getAssignedStudents = async (req, res, next) => {
  try {
    const advisorId = req.user.id;

    // Find all internships assigned to this advisor
    const internships = await Internship.find({ advisor_id: advisorId })
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'fullName email username isActivated phone isActive status' }
      })
      .populate('company');

    // For each internship, let's get report status counts
    const data = await Promise.all(internships.map(async (intern) => {
      const reports = await Report.find({ internship: intern._id });
      return {
        ...intern.toObject(),
        reportCounts: {
          total: reports.length,
          pending: reports.filter(r => r.status === 'Pending').length,
          approved: reports.filter(r => r.status === 'Approved').length
        }
      };
    }));

    res.status(200).json({ success: true, count: internships.length, data });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get Advisor Stats
// @route   GET /api/advisor/stats
// @access  Private (Advisor)
// ─────────────────────────────────────────────────────────────
export const getAdvisorStats = async (req, res, next) => {
  try {
    const advisorId = req.user.id;

    const internships = await Internship.find({ advisor_id: advisorId });

    const studentUserIds = internships.map(i => i.student);

    const activeInternships = internships.filter(i => i.status === 'ACTIVE' || i.status === 'APPROVED').length;

    const reports = await Report.find({
      internship: { $in: internships.map(i => i._id) }
    });

    const pendingReports = reports.filter(r => r.status === 'Pending').length;

    // Placeholder for unread messages (if messaging system exists)
    const Message = (await import('../models/Message.js')).default;
    const unreadMessages = await Message.countDocuments({ receiver: advisorId, isRead: false });

    res.status(200).json({
      success: true,
      data: {
        totalStudents: internships.length,
        activeInternships,
        pendingReports,
        unreadMessages
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get reports for a specific student/internship
// @route   GET /api/advisor/reports/:internshipId
// @access  Private (Advisor)
// ─────────────────────────────────────────────────────────────
export const getReportsByStudent = async (req, res, next) => {
  try {
    const reports = await Report.find({ internship: req.params.internshipId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Review a report (Approve / Request Revision)
// @route   PUT /api/advisor/report/:reportId
// @access  Private (Advisor)
// ─────────────────────────────────────────────────────────────
export const reviewReport = async (req, res, next) => {
  try {
    const { status, feedback } = req.body;
    const reportId = req.params.reportId;

    if (!['Approved', 'Revision Required'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be Approved or Revision Required.' });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.status = status;
    if (feedback) {
      report.feedback = feedback;
    }
    await report.save();

    await AuditLog.create({
      user: req.user.id,
      action: 'report_reviewed',
      details: `Report ${reportId} marked as ${status}`,
      ip: req.ip
    });

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};


// ─────────────────────────────────────────────────────────────
// @desc    Evaluate student and assign final grade
// @route   POST /api/advisor/internship/:internshipId/evaluate
// @access  Private (Advisor)
// ─────────────────────────────────────────────────────────────
export const evaluateStudent = async (req, res, next) => {
  try {
    const internshipId = req.params.internshipId;
    const {
      companyGrade,
      documentationGrade,
      implementationGrade,
      presentationGrade,
      advisorComment
    } = req.body;

    const internship = await Internship.findOne({ _id: internshipId, advisor_id: req.user.id });
    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship not found or not assigned to you' });
    }

    if (internship.status === 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'This internship is already completed and locked. No further grading changes allowed.' });
    }

    // Calculate total
    const total = (companyGrade * 0.30) +
      (documentationGrade * 0.25) +
      (implementationGrade * 0.25) +
      (presentationGrade * 0.20);
    const advisorScore = Number(total.toFixed(2));

    const settings = await Settings.findOne().select('academicSettings.gradingSystem');
    const gradingRules = Array.isArray(settings?.academicSettings?.gradingSystem) && settings.academicSettings.gradingSystem.length
      ? settings.academicSettings.gradingSystem
      : getDefaultGradingSystem();
    const mappedGrade = mapScoreToGrade(advisorScore, gradingRules);
    if (!mappedGrade) {
      return res.status(400).json({ success: false, message: 'Unable to map advisor score to configured grading intervals.' });
    }

    // Create an Evaluation record (matching the new weights)
    const evaluation = await Evaluation.create({
      student: internship.student,
      advisor: req.user.id,
      internship: internshipId,
      scores: {
        companyGrade,
        documentationGrade,
        implementationGrade,
        presentationGrade
      },
      advisorFeedback: advisorComment,
      advisorScore,
      finalGrade: advisorScore,
      letterGrade: mappedGrade.letterGrade,
      gradePoint: mappedGrade.gradePoint,
      gradeStatus: mappedGrade.status
    });

    // Update internship with component grades and mark as graded
    internship.finalGrade = {
      companyGrade,
      documentationGrade,
      implementationGrade,
      presentationGrade,
      advisorScore,
      total: advisorScore,
      letterGrade: mappedGrade.letterGrade,
      gradePoint: mappedGrade.gradePoint,
      status: mappedGrade.status,
      description: mappedGrade.description || ''
    };
    internship.status = 'GRADED';
    internship.presentationCompleted = true; // Evaluation occurs after presentation
    await internship.save();

    // Check for full completion criteria
    const completionStatus = await checkAndCompleteInternship(internshipId);

    await AuditLog.create({
      user: req.user.id,
      action: 'grade_assigned',
      details: `Assigned final grade ${total.toFixed(2)} for internship ${internshipId}. Completion: ${completionStatus.success}`,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: completionStatus.success
        ? 'Student evaluated and internship marked as COMPLETED.'
        : `Student graded (Status: GRADED). Note: ${completionStatus.message}`,
      data: evaluation
    });
  } catch (error) {
    next(error);
  }
};
