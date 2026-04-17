import Student from '../models/Student.js';
import User from '../models/User.js';
import Internship from '../models/Internship.js';
import AuditLog from '../models/AuditLog.js';

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
      .populate('user', 'name email isActivated role')
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

    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship not found' });
    }

    internship.status = status;
    await internship.save();

    await AuditLog.create({
      user: req.user.id,
      action: `internship_${status.toLowerCase()}`,
      details: `Internship ${internshipId} ${status.toLowerCase()}`,
      ip: req.ip
    });

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

    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship not found' });
    }

    if (internship.status !== 'Approved' && internship.status !== 'Active') {
      return res.status(400).json({ success: false, message: 'Internship must be approved before assigning an advisor' });
    }

    const advisor = await User.findOne({ _id: advisorId, role: 'advisor' });
    if (!advisor) {
      return res.status(404).json({ success: false, message: 'Advisor not found or invalid user role' });
    }

    internship.advisor = advisor._id;
    // Potentially upgrade state to active
    if (internship.status === 'Approved') {
       internship.status = 'Active';
    }
    
    await internship.save();

    await AuditLog.create({
      user: req.user.id,
      action: 'advisor_assigned',
      details: `Assisted advisor ${advisor.username} to internship ${internshipId}`,
      ip: req.ip
    });

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
