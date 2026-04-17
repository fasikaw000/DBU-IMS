import Internship from '../models/Internship.js';
import Student from '../models/Student.js';
import Company from '../models/Company.js';
import { notify } from './notificationController.js';
import User from '../models/User.js';

// @desc    Apply for internship
// @route   POST /api/internships/apply
// @access  Private/Student
export const applyInternship = async (req, res) => {
  try {
    const {
      company_name,
      location,
      field,
      supervisor_name,
      supervisor_email,
      supervisor_phone,
      start_date,
      end_date
    } = req.body;

    // 1. Find the student record for the logged-in user
    const student = await Student.findOne({ user: req.user._id || req.user.id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found for this user',
        data: null
      });
    }

    // 2. Check if student already has an internship
    // The model has unique: true on student field, so mongo would catch it anyway
    const existingInternship = await Internship.findOne({ student: student._id });
    if (existingInternship) {
      return res.status(400).json({
        success: false,
        message: 'You already have an internship application',
        data: null
      });
    }

    // 3. Create Company first (Pending status)
    const company = await Company.create({
      name: company_name,
      location,
      industry: field, // Use field as a placeholder for industry if not provided
      createdByStudent: true,
      addedBy: req.user.id
    });

    // 4. Create internship linking to the company
    const internship = await Internship.create({
      student: student._id,
      company: company._id,
      field,
      startDate: start_date,
      endDate: end_date,
      companySupervisorName: supervisor_name,
      companySupervisorEmail: supervisor_email,
      companySupervisorPhone: supervisor_phone,
      status: 'PENDING_APPROVAL' 
    });

    res.status(201).json({
      success: true,
      message: 'Internship application submitted successfully',
      data: internship
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
      data: null
    });
  }
};

// @desc    Approve internship
// @route   PUT /api/internships/:id/approve
// @access  Private/Department Head
export const approveInternship = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Internship not found',
        data: null
      });
    }

    internship.status = 'APPROVED';
    await internship.save();

    // Notify student
    const populatedInternship = await internship.populate('student');
    if (populatedInternship.student && populatedInternship.student.user) {
        await notify(
            populatedInternship.student.user, 
            'internship_approved', 
            `Your internship application for ${populatedInternship.field} has been approved!`,
            `/internships/${internship._id}`
        );
    }

    res.status(200).json({
      success: true,
      message: 'Internship approved successfully',
      data: internship
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
      data: null
    });
  }
};

// @desc    Reject internship
// @route   PUT /api/internships/:id/reject
// @access  Private/Department Dean
export const rejectInternship = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Internship not found',
        data: null
      });
    }

    internship.status = 'REJECTED';
    await internship.save();

    res.status(200).json({
      success: true,
      message: 'Internship rejected successfully',
      data: internship
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
      data: null
    });
  }
};

// @access  Private/Department Dean
export const getPendingInternships = async (req, res) => {
  try {
    const internships = await Internship.find({ status: 'PENDING_APPROVAL' })
      .populate('student')
      .populate('company');

    res.status(200).json({
      success: true,
      count: internships.length,
      data: internships
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
      data: null
    });
  }
};

// @desc    Assign advisor to internship
// @route   PUT /api/internships/:id/assign-advisor
// @access  Private/Department Head
export const assignAdvisor = async (req, res) => {
  try {
    const { advisor_id } = req.body;
    const internship = await Internship.findById(req.params.id);

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Internship not found',
        data: null
      });
    }

    // Verify advisor role
    const advisor = await User.findById(advisor_id);
    if (!advisor || advisor.role !== 'advisor') {
      return res.status(400).json({
        success: false,
        message: 'Invalid advisor ID or user is not an advisor',
        data: null
      });
    }

    internship.advisor_id = advisor_id;
    await internship.save();

    // Notify advisor
    await notify(
        advisor_id, 
        'advisor_assigned', 
        'You have been assigned as an advisor for a new internship.',
        `/advisor/internships`
    );

    res.status(200).json({
      success: true,
      message: 'Advisor assigned successfully',
      data: internship
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
      data: null
    });
  }
};

// @desc    Get logged-in student's internship
// @route   GET /api/internships/my-internship
// @access  Private (Student)
export const getStudentInternship = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
        return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    const internship = await Internship.findOne({ student: student._id })
      .populate('advisor_id', 'name email');

    if (!internship) {
      return res.status(404).json({ 
        success: false,
        message: 'No internship found for this student',
        data: null 
      });
    }

    res.status(200).json({
      success: true,
      data: internship
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Upload company evaluation PDF
// @route   POST /api/internships/upload-evaluation
// @access  Private (Student)
export const uploadEvaluation = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a PDF file' });
    }

    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
        return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    const internship = await Internship.findOne({ student: student._id });
    if (!internship) {
      return res.status(404).json({ success: false, message: 'No active internship found to evaluate' });
    }

    // Store local path
    const fileUrl = `/uploads/${req.file.filename}`;
    internship.companyEvaluationUrl = fileUrl;
    await internship.save();

    // Notify advisor
    if (internship.advisor_id) {
        await notify(
            internship.advisor_id, 
            'evaluation_submitted', 
            `Student ${req.user.name} has uploaded their company evaluation document.`,
            `/advisor/internships`
        );
    }

    res.status(200).json({
      success: true,
      message: 'Evaluation document uploaded successfully',
      data: { url: fileUrl }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during upload', 
      error: error.message 
    });
  }
};
// @desc    Check and finalize internship completion
// @access  Private (Internal/Advisor)
export const checkAndCompleteInternship = async (internshipId) => {
    const Report = (await import('../models/Report.js')).default;
    const Internship = (await import('../models/Internship.js')).default;

    const internship = await Internship.findById(internshipId);
    if (!internship) return false;

    // 1. Check Weekly Reports (At least 1 for now, or specific count if defined)
    const weeklyReports = await Report.countDocuments({ internship: internshipId, type: 'WEEKLY' });
    if (weeklyReports === 0) return { success: false, message: 'Weekly reports missing' };

    // 2. Check Final Report
    const finalReport = await Report.findOne({ internship: internshipId, type: 'FINAL' });
    if (!finalReport) return { success: false, message: 'Final report missing' };

    // 3. Check Company Evaluation
    if (!internship.companyEvaluationUrl) return { success: false, message: 'Company evaluation document missing' };

    // 4. Check Presentation & Advisor Grades
    if (!internship.presentationCompleted) return { success: false, message: 'Project presentation not marked as completed' };
    if (!internship.finalGrade || !internship.finalGrade.total) return { success: false, message: 'Final evaluation grades missing' };

    // All criteria met
    internship.status = 'COMPLETED';
    await internship.save();
    return { success: true };
};
