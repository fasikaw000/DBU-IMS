import Student from '../models/Student.js';
import User from '../models/User.js';
import Internship from '../models/Internship.js';
import AuditLog from '../models/AuditLog.js';
import Company from '../models/Company.js';
import Placement from '../models/Placement.js';
import Department from '../models/Department.js';
import { notify } from './notificationController.js';

// ─────────────────────────────────────────────────────────────
// @desc    Get all students in the dean's department
// @route   GET /api/department/students
// @access  Private (Department Dean)
// ─────────────────────────────────────────────────────────────
export const getDepartmentStudents = async (req, res, next) => {
  try {
    const deanId = req.user.id;
    // Populate department to get the name and other details
    const dean = await User.findById(deanId).populate('department');

    if (!dean || !dean.department) {
      return res.status(200).json({ success: true, count: 0, data: [], message: 'Dean is not assigned to a department' });
    }

    const deptId = dean.department._id || dean.department;
    const deptName = dean.department.name || 'Department';

    // Find all department IDs with same name (handle duplicates)
    const similarDepts = await Department.find({ name: deptName }).select('_id');
    const allDeptIds = similarDepts.map(d => d._id);

    // Find student user IDs in these departments
    const studentUsers = await User.find({
      department: { $in: allDeptIds },
      role: { $regex: /^student$/i }
    }).select('_id');
    const userIds = studentUsers.map(u => u._id);

    // Find student profiles
    const students = await Student.find({
      $or: [
        { department: { $in: allDeptIds } },
        { user: { $in: userIds } }
      ]
    })
      .populate('user', 'name email username isActivated role phone isActive status')
      .populate('department', 'name code')
      .lean();

    // Standardize mapping to match Admin view and user requirements
    const mappedStudents = await Promise.all(students.map(async (s) => {
      try {
        const internship = await Internship.findOne({ student: s._id })
          .populate('company', 'name city subcity country')
          .populate('advisor_id', 'name');

        return {
          _id: s._id,
          userId: s.user?._id,
          fullName: s.user?.name || 'N/A', // Mapping 'name' to 'fullName' as requested
          email: s.user?.email || 'N/A',
          username: s.username || s.user?.username || 'N/A',
          studentId: s.studentId || 'N/A',
          department: s.department?.name || deptName || 'N/A',
          year: s.year || 'N/A',
          phone: s.phone || s.user?.phone || 'N/A',
          cbeAccount: s.cbeAccount || 'N/A',
          isActivated: s.user?.isActivated || false,
          isActive: s.user?.isActive !== false,
          accountStatus: s.user?.isActive === false ? 'Inactive' : 'Active',
          internship: internship, // Include full internship object
          internshipStatus: internship?.status || 'NOT_APPLIED',
          status: internship?.status || 'NOT_APPLIED',
          companyName: internship?.company?.name || 'N/A',
          createdAt: s.createdAt
        };
      } catch (err) {
        return null;
      }
    }));

    const finalData = mappedStudents.filter(s => s !== null);

    res.status(200).json({ success: true, count: finalData.length, data: finalData });
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
    const { status, message: revisionMessage } = req.body; // 'Approved', 'Rejected', or 'Revision Required'
    const internshipId = req.params.internshipId;

    if (!['Approved', 'Rejected', 'Revision Required'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const internship = await Internship.findById(internshipId).populate({
      path: 'student',
      populate: { path: 'user' }
    });

    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship not found' });
    }

    if (status === 'Revision Required') {
      internship.status = 'REVISION_REQUIRED';
      internship.revisionMessage = revisionMessage || 'Please correct the issues in your application and resubmit.';
    } else if (status === 'Rejected') {
      internship.status = 'REJECTED';
      internship.revisionMessage = revisionMessage || 'Your application was rejected by the department.';
    } else {
      internship.status = 'APPROVED';
    }

    await internship.save();

    if (status === 'Approved') {
      const studentProfile = internship.student;

      await Placement.create({
        student: studentProfile?._id,
        company: internship.company,
        department: studentProfile?.department,
        status: 'AWAITING_ASSIGNMENT',
        startDate: internship.startDate,
        endDate: internship.endDate,
        supervisorName: internship.companySupervisorName,
        supervisorEmail: internship.companySupervisorEmail,
        supervisorPhone: internship.companySupervisorPhone
      });

      await Company.findByIdAndUpdate(internship.company, {
        $addToSet: { students: studentProfile?._id || internship.student },
        approvalStatus: 'APPROVED',
        isActive: true
      });
    }

    await AuditLog.create({
      user: req.user.id,
      action: `internship_${status.toLowerCase()}`,
      targetResource: { model: 'Internship', documentId: internshipId },
      details: `Internship ${internshipId} ${status.toLowerCase()}`,
      ip: req.ip
    });

    if (internship.student && internship.student.user) {
      const type = status === 'Approved' ? 'APPLICATION_APPROVED' : 'APPLICATION_REJECTED';
      await notify(
        internship.student.user._id,
        type,
        `Your internship application has been ${status.toLowerCase()}.`,
        '/student-dashboard'
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

    if (internship.student?.user?.isActive === false) {
      return res.status(400).json({ success: false, message: 'Cannot assign advisor to a deactivated student' });
    }

    const advisor = await User.findOne({ _id: advisorId, role: 'advisor', isActive: true });
    if (!advisor) {
      return res.status(404).json({ success: false, message: 'Advisor not found or invalid user role (must be active advisor)' });
    }

    internship.advisor_id = advisor._id;
    internship.status = 'ACTIVE';

    await internship.save();

    const studentProfile = await Student.findOne({ user: internship.student?._id || internship.student });

    await Placement.findOneAndUpdate(
      { student: studentProfile?._id || internship.student, company: internship.company },
      { advisor: advisor._id, status: 'ASSIGNED' }
    );

    if (studentProfile) {
      studentProfile.assignedAdvisor = advisor._id;
      await studentProfile.save();
    }

    await AuditLog.create({
      user: req.user.id,
      action: 'advisor_assigned',
      targetResource: { model: 'Internship', documentId: internshipId },
      details: `Assisted advisor ${advisor.name} to internship ${internshipId}`,
      ip: req.ip
    });

    await notify(
      advisor._id,
      'ADVISOR_ASSIGNED',
      `You have been assigned as an advisor for student ${internship.student?.user?.name || 'Unknown'}.`,
      '/advisor/dashboard'
    );

    if (internship.student && internship.student.user) {
      await notify(
        internship.student.user._id,
        'ADVISOR_ASSIGNED',
        `${advisor.name} has been assigned as your faculty advisor.`,
        '/student-dashboard'
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
    const dean = await User.findById(req.user.id).populate('department');
    if (!dean || !dean.department) {
      return res.status(400).json({ success: false, message: 'Dean not assigned to a department' });
    }

    const deptName = dean.department.name;
    const similarDepts = await Department.find({ name: deptName }).select('_id');
    const allDeptIds = similarDepts.map(d => d._id);

    const advisors = await User.find({ role: 'advisor', department: { $in: allDeptIds } }).select('name username email isActive status');

    const workloads = await Promise.all(advisors.map(async (adv) => {
      const activeInternships = await Internship.countDocuments({ advisor_id: adv._id, status: { $in: ['Active', 'Approved', 'ACTIVE', 'APPROVED', 'Ongoing', 'ONGOING'] } });
      return { advisor: adv, count: activeInternships };
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
    const dean = await User.findById(req.user.id).populate('department');
    if (!dean || !dean.department) {
      return res.status(400).json({ success: false, message: 'Dean not assigned to a department' });
    }

    const deptName = dean.department.name;
    const similarDepts = await Department.find({ name: deptName }).select('_id');
    const allDeptIds = similarDepts.map(d => d._id);

    const studentUsers = await User.find({
      department: { $in: allDeptIds },
      role: { $regex: /^student$/i }
    }).select('_id');
    const userIds = studentUsers.map(u => u._id);

    const students = await Student.find({
      $or: [
        { department: { $in: allDeptIds } },
        { user: { $in: userIds } }
      ]
    }).select('_id');
    const studentIds = students.map(s => s._id);

    const totalAdvisors = await User.countDocuments({ role: 'advisor', department: { $in: allDeptIds } });

    const pendingApplications = await Internship.countDocuments({
      student: { $in: studentIds },
      status: { $in: ['PENDING', 'PENDING_APPROVAL', 'RESUBMITTED', 'REVISION_REQUIRED'] }
    });

    const awaitingAdvisor = await Internship.countDocuments({
      student: { $in: studentIds },
      status: 'APPROVED',
      advisor_id: { $exists: false }
    });

    const activeInternships = await Internship.countDocuments({
      student: { $in: studentIds },
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

// ─────────────────────────────────────────────────────────────
// @desc    Get internship history/audit logs
// @route   GET /api/department/internship/:internshipId/history
// @access  Private (Department Dean)
// ─────────────────────────────────────────────────────────────
export const getInternshipHistory = async (req, res, next) => {
  try {
    const { internshipId } = req.params;

    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship not found' });
    }

    const logs = await AuditLog.find({
      $or: [
        { 'targetResource.documentId': internshipId },
        { details: { $regex: String(internshipId), $options: 'i' } }
      ]
    })
      .populate('user', 'name role')
      .sort({ createdAt: -1 });

    const history = [...logs];
    const hasSubmission = logs.some(l => l.action.includes('submitted') || l.action.includes('apply'));

    if (!hasSubmission) {
      history.push({
        _id: 'initial-' + internshipId,
        action: 'application_submitted',
        details: 'The internship application was submitted and registered in the system.',
        createdAt: internship.createdAt,
        user: { name: 'System' }
      });
    }

    res.status(200).json({ success: true, data: history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
  } catch (error) {
    next(error);
  }
};
