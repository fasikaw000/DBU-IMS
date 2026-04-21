import Student from '../models/Student.js';
import Internship from '../models/Internship.js';
import Report from '../models/Report.js';
import Evaluation from '../models/Evaluation.js';
import Logbook from '../models/Logbook.js';
import AuditLog from '../models/AuditLog.js';
import { checkAndCompleteInternship } from './internshipController.js';

// ─────────────────────────────────────────────────────────────
// @desc    Get advisor's assigned students
// @route   GET /api/advisor/students
// @access  Private (Advisor)
// ─────────────────────────────────────────────────────────────
export const getAssignedStudents = async (req, res, next) => {
  try {
    const advisorId = req.user.id;

    // Find all internships assigned to this advisor
    const internships = await Internship.find({ advisor: advisorId })
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email username isActivated' }
      });

    res.status(200).json({ success: true, count: internships.length, data: internships });
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

    // Optional: check if report's student is mapped to this advisor
    
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

    const internship = await Internship.findOne({ _id: internshipId, advisor: req.user.id });
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
      finalGrade: total
    });

    // Update internship with component grades and mark as graded
    internship.finalGrade = {
      companyGrade,
      documentationGrade,
      implementationGrade,
      presentationGrade,
      total
    };
    internship.status = 'GRADED';
    internship.presentationCompleted = true; // Evaluation occurs after presentation
    await internship.save();

    // Check for full completion criteria
    const completionStatus = await checkAndCompleteInternship(internshipId);

    await AuditLog.create({
      user: req.user.id,
      action: 'student_evaluated',
      details: `Evaluated internship ${internshipId} with final grade ${total}. Completion: ${completionStatus.success}`,
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
