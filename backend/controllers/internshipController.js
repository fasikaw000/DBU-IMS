import Internship from '../models/Internship.js';
import Student from '../models/Student.js';
import Company from '../models/Company.js';
import User from '../models/User.js';
import { notify } from './notificationController.js';

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

    // 3. Find or create company
    let company = await Company.findOne({ name: company_name });
    if (!company) {
      company = await Company.create({
        name: company_name,
        location: location,
        createdByStudent: true,
        addedBy: req.user._id || req.user.id,
        approvalStatus: 'PENDING'
      });
    }

    // 4. Handle Company Supervisor (Supervisor) account
    let supervisor = await User.findOne({ email: supervisor_email });
    if (!supervisor) {
        // Create new supervisor account with temporary password
        supervisor = await User.create({
            name: supervisor_name,
            email: supervisor_email,
            password: 'Welcome123!',
            role: 'supervisor'
        });
    }

    // 5. Create internship
    const internship = await Internship.create({
      student: student._id,
      company: company._id,
      field,
      startDate: start_date,
      endDate: end_date,
      companySupervisorName: supervisor_name,
      companySupervisorPhone: supervisor_phone,
      supervisor_id: supervisor._id,
      status: 'pending' 
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

    internship.status = 'approved';
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
// @access  Private/Department Head
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

    internship.status = 'rejected';
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

// @desc    Get all pending internships
// @route   GET /api/internships/pending
// @access  Private/Department Head
export const getPendingInternships = async (req, res) => {
  try {
    const internships = await Internship.find({ status: 'pending' })
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
    const internship = await Internship.findOne({ student_id: req.user._id })
      .populate('advisor_id', 'name email')
      .populate('supervisor_id', 'name email phone');

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

// @desc    Get students assigned to supervisor
// @route   GET /api/internships/supervisor/students
// @access  Private (Supervisor)
export const getSupervisorInternships = async (req, res) => {
  try {
    const internships = await Internship.find({ supervisor_id: req.user._id })
      .populate('student_id', 'name studentId email department phone');

    res.status(200).json({
      success: true,
      data: internships
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
