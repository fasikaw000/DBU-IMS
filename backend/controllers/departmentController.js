import Student from '../models/Student.js';
import User from '../models/User.js';
import Internship from '../models/Internship.js';
import AuditLog from '../models/AuditLog.js';
import { notify } from './notificationController.js';

// ─────────────────────────────────────────────────────────────
// @desc    Get all students in the dean's department
// @route   GET /api/department/students
// @access  Private (Department Dean)
// ─────────────────────────────────────────────────────────────
export const getDepartmentStudents = async (req, res, next) => {
  try {
    const deanId = req.user.id;
    const dean = await User.findById(deanId);

    if (!dean.department) {
      return res.status(400).json({ success: false, message: 'Dean is not assigned to a department' });
    }

    const students = await Student.find({ department: dean.department })
      .populate('user', 'name email isActivated role phoneNumber')
      .lean();

    // Attach internship info for these students
    for (let student of students) {
      const internship = await Internship.findOne({ student: student.user._id })
        .populate('advisor', 'name email');
      student.internship = internship || null;
    }

    res.status(200).json({ success: true, count: students.length, data: students });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Approve or reject internship application
// @route   PUT /api/department/internship/:internshipId
// @access  Private (Department Dean)
// ─────────────────────────────────────────────────────────────
export const processInternshipApp = async (req, res, next) => {
  try {
    const { status } = req.body; // 'Approved' or 'Rejected'
    const internshipId = req.params.internshipId;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const internship = await Internship.findById(internshipId).populate({
      path: 'student',
      populate: { path: 'user' }
    });
    
    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship not found' });
    }

    internship.status = status === 'Approved' ? 'APPROVED' : 'REJECTED';
    await internship.save();

    await AuditLog.create({
      user: req.user.id,
      action: `internship_${status.toLowerCase()}`,
      details: `Internship ${internshipId} ${status.toLowerCase()}`,
      ip: req.ip
    });

    // Notify student
    if (internship.student && internship.student.user) {
      await notify(
        internship.student.user._id,
        'internship_status_update',
        `Your internship application has been ${status.toLowerCase()}.`,
        '/student/dashboard'
      );
    }

    res.status(200).json({ success: true, data: internship });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Assign advisor to an approved internship
// @route   PUT /api/department/internship/:internshipId/advisor
// @access  Private (Department Dean)
// ─────────────────────────────────────────────────────────────
export const assignAdvisor = async (req, res, next) => {
  try {
    const internshipId = req.params.internshipId;
    const { advisorId } = req.body;

    const internship = await Internship.findById(internshipId).populate({
      path: 'student',
      populate: { path: 'user' }
    });

    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship not found' });
    }

    const advisor = await User.findOne({ _id: advisorId, role: 'advisor' });
    if (!advisor) {
      return res.status(404).json({ success: false, message: 'Advisor not found or invalid user role' });
    }

    internship.advisor = advisor._id;
    internship.advisor_id = advisor._id; // Keeping both for compatibility if needed
    
    // Potentially upgrade state to active
    if (internship.status === 'APPROVED' || internship.status === 'Approved') {
       internship.status = 'ACTIVE';
    }
    
    await internship.save();

    await AuditLog.create({
      user: req.user.id,
      action: 'advisor_assigned',
      details: `Assisted advisor ${advisor.name} to internship ${internshipId}`,
      ip: req.ip
    });

    // Notify advisor
    await notify(
      advisor._id,
      'new_student_assigned',
      `You have been assigned as an advisor for student ${internship.student?.user?.name || 'Unknown'}.`,
      '/advisor/dashboard'
    );

    // Notify student
    if (internship.student && internship.student.user) {
      await notify(
        internship.student.user._id,
        'advisor_assigned',
        `${advisor.name} has been assigned as your faculty advisor.`,
        '/student/dashboard'
      );
    }

    res.status(200).json({ success: true, message: 'Advisor assigned successfully', data: internship });
  } catch (error) {
    next(error);
  }
};


// ─────────────────────────────────────────────────────────────
// @desc    Get advisor workload in the department
// @route   GET /api/department/advisors/workload
// @access  Private (Department Dean)
// ─────────────────────────────────────────────────────────────
export const getAdvisorWorkload = async (req, res, next) => {
  try {
    const dean = await User.findById(req.user.id);
    const advisors = await User.find({ role: 'advisor', department: dean.department }).select('name username email');

    const workloads = await Promise.all(advisors.map(async (adv) => {
      const activeInternships = await Internship.countDocuments({ advisor: adv._id, status: { $in: ['Active', 'Approved'] }});
      return { advisor: adv, activeStudentsCount: activeInternships };
    }));

    res.status(200).json({ success: true, data: workloads });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get department statistics for Dean dashboard
// @route   GET /api/department/stats
// @access  Private (Department Dean)
// ─────────────────────────────────────────────────────────────
export const getDepartmentStats = async (req, res, next) => {
  try {
    const dean = await User.findById(req.user.id);
    if (!dean.department) {
      return res.status(400).json({ success: false, message: 'Dean not assigned to a department' });
    }

    const deptId = dean.department;

    // 1. Total Advisors in department
    const totalAdvisors = await User.countDocuments({ role: 'advisor', department: deptId });

    // 2. Students in department
    const students = await Student.find({ department: deptId }).select('user');
    const studentUserIds = students.map(s => s.user);

    // 3. Pending Applications (PENDING_APPROVAL)
    const pendingApplications = await Internship.countDocuments({ 
      student: { $in: studentUserIds },
      status: 'PENDING_APPROVAL'
    });

    // 4. Students Awaiting Placement Approval (same as pending applications in this context, but let's say "Awaiting Advisor")
    const awaitingAdvisor = await Internship.countDocuments({
      student: { $in: studentUserIds },
      status: 'APPROVED',
      advisor_id: { $exists: false }
    });

    // 5. Active Internships
    const activeInternships = await Internship.countDocuments({
      student: { $in: studentUserIds },
      status: 'ACTIVE'
    });

    res.status(200).json({
      success: true,
      data: {
        pendingApplications,
        totalAdvisors,
        awaitingAdvisor,
        activeInternships
      }
    });
  } catch (error) {
    next(error);
  }
};

