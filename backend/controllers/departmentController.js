import Student from '../models/Student.js';
import User from '../models/User.js';
import Internship from '../models/Internship.js';
import AuditLog from '../models/AuditLog.js';
import Company from '../models/Company.js';
import Placement from '../models/Placement.js';
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
      const internship = await Internship.findOne({ student: student._id })
        .populate('advisor_id', 'name email')
        .populate('company', 'name country city subcity');
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

    // Point 2: DEAN APPROVAL (CRITICAL FIX)
    if (status === 'Approved') {
      const studentProfile = internship.student;

      // A. CREATE PLACEMENT RECORD
      await Placement.create({
        student: studentProfile?._id,
        company: internship.company,
        department: studentProfile?.department,
        status: 'AWAITING_ASSIGNMENT',
        startDate: internship.startDate,
        endDate: internship.endDate,
        // Carry over supervisor info to placement if we decide to store it there too
        supervisorName: internship.companySupervisorName,
        supervisorEmail: internship.companySupervisorEmail,
        supervisorPhone: internship.companySupervisorPhone
      });

      // Point 3: LINK STUDENT TO COMPANY & APPROVE COMPANY (CLEAN)
      await Company.findByIdAndUpdate(internship.company, {
        $addToSet: { students: studentProfile?._id || internship.student },
        approvalStatus: 'APPROVED',
        isActive: true
        // REMOVED: contactPerson, email, phone overwrite
      });
    }

    await AuditLog.create({
      user: req.user.id,
      action: `internship_${status.toLowerCase()}`,
      targetResource: { model: 'Internship', documentId: internshipId },
      details: `Internship ${internshipId} ${status.toLowerCase()}`,
      ip: req.ip
    });

    // Notify student
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

    const advisor = await User.findOne({ _id: advisorId, role: 'advisor' });
    if (!advisor) {
      return res.status(404).json({ success: false, message: 'Advisor not found or invalid user role' });
    }

    internship.advisor_id = advisor._id;

    // Update state to ACTIVE as the workflow is now fully assigned
    internship.status = 'ACTIVE';

    await internship.save();

    // Point 6: ASSIGN ADVISOR
    const studentProfile = await Student.findOne({ user: internship.student?._id || internship.student });

    // Update placement
    await Placement.findOneAndUpdate(
      { student: studentProfile?._id || internship.student, company: internship.company },
      { advisor: advisor._id, status: 'ASSIGNED' }
    );

    // Update student
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

    // Notify advisor
    await notify(
      advisor._id,
      'ADVISOR_ASSIGNED',
      `You have been assigned as an advisor for student ${internship.student?.user?.name || 'Unknown'}.`,
      '/advisor/dashboard'
    );

    // Notify student
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
    const dean = await User.findById(req.user.id);
    const advisors = await User.find({ role: 'advisor', department: dean.department }).select('name username email');

    const workloads = await Promise.all(advisors.map(async (adv) => {
      const activeInternships = await Internship.countDocuments({ advisor_id: adv._id, status: { $in: ['Active', 'Approved'] } });
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
    const students = await Student.find({ department: deptId }).select('_id');
    const studentIds = students.map(s => s._id);

    // 3. Pending Applications (PENDING_APPROVAL)
    const pendingApplications = await Internship.countDocuments({
      student: { $in: studentIds },
      status: { $in: ['PENDING', 'PENDING_APPROVAL', 'RESUBMITTED', 'REVISION_REQUIRED'] }
    });

    // 4. Students Awaiting Placement Approval (same as pending applications in this context, but let's say "Awaiting Advisor")
    const awaitingAdvisor = await Internship.countDocuments({
      student: { $in: studentIds },
      status: 'APPROVED',
      advisor_id: { $exists: false }
    });

    // 5. Active Internships
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

    // 1. Fetch the internship to get its creation date
    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship not found' });
    }

    // 2. Search for logs using both the documentId and the string details
    const logs = await AuditLog.find({
      $or: [
        { 'targetResource.documentId': internshipId },
        { details: { $regex: String(internshipId), $options: 'i' } }
      ]
    })
      .populate('user', 'name role')
      .sort({ createdAt: -1 });

    // 3. Always include at least the creation event (for backward compatibility)
    const history = [...logs];

    // Check if we already have a submission log
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
