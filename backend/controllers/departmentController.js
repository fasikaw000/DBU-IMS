import Student from '../models/Student.js';
import Internship from '../models/Internship.js';
import Company from '../models/Company.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

// @desc    Approve/Reject Student-Submitted Company
// @route   PUT /api/department/company/:id/approve
// @access  Private (DEPARTMENT_HEAD only)
export const approveCompany = async (req, res, next) => {
  try {
    const { status } = req.body; // 'APPROVED' or 'REJECTED'
    const companyId = req.params.id;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Status must be APPROVED or REJECTED', data: null });
    }

    const company = await Company.findById(companyId);
    if (!company) {
        return res.status(404).json({ success: false, message: 'Company not found', data: null });
    }

    company.approvalStatus = status;
    company.departmentApprover = req.user.id;
    await company.save();

    // Audit the action
    await AuditLog.create({
        action: `COMPANY_${status}`,
        performedBy: req.user.id,
        targetResource: { model: 'Company', documentId: company._id }
    });

    res.status(200).json({ success: true, message: `Company ${status}`, data: company });
  } catch (err) {
    next(err);
  }
};

// @desc    Assign Advisor to Internship Workflow (Manual or Auto)
// @route   PUT /api/department/internship/:id/assign
// @access  Private (DEPARTMENT_HEAD only)
export const assignAdvisor = async (req, res, next) => {
    try {
        const internshipId = req.params.id;
        let { advisorId, autoAssign } = req.body;

        const internship = await Internship.findById(internshipId).populate('student');
        if (!internship) return res.status(404).json({ success: false, message: 'Internship not found', data: null });

        if (internship.status === 'NOT_APPLIED') {
            return res.status(400).json({ success: false, message: 'Cannot assign advisor. Student has not applied.', data: null });
        }

        // Auto-Assignment Logic: Find an active advisor with the fewest current workloads
        if (autoAssign) {
            const workloadCounts = await Internship.aggregate([
                { $group: { _id: "$advisor", count: { $sum: 1 } } }
            ]);
            
            // Map the db to find advisors with fewest students
            const allAdvisors = await User.find({ role: 'ADVISOR' });
            if (allAdvisors.length === 0) {
                 return res.status(404).json({ success: false, message: 'No advisors exist in system to auto-assign.', data: null });
            }

            // A simplified selection of the first advisor (for advanced logic, map vs workloadCounts here)
            advisorId = allAdvisors[0]._id;
        }

        const advisor = await User.findById(advisorId);
        if (!advisor || advisor.role !== 'ADVISOR') {
             return res.status(400).json({ success: false, message: 'Invalid Advisor ID provided', data: null });
        }

        internship.advisor = advisor._id;
        // Bump lifecycle to ONGOING if company is also approved
        const company = await Company.findById(internship.company);
        if (company.approvalStatus === 'APPROVED') {
            internship.status = 'ONGOING';
        }
        await internship.save();

        res.status(200).json({ success: true, message: `Advisor assigned successfully. Workflow status is now ${internship.status}.`, data: internship });

    } catch (err) {
        next(err);
    }
}
