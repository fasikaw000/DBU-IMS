const Internship = require('../models/Internship');
const Logbook = require('../models/Logbook');
const Report = require('../models/Report');
const Notification = require('../models/Notification'); // Used to trigger alerts to student

// @desc    Get assigned students' internships
// @route   GET /api/advisor/students
// @access  Private (ADVISOR only)
exports.getAssignedStudents = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;

        const internships = await Internship.find({ advisor: req.user.id })
            .populate({ path: 'student', populate: { path: 'user', select: 'name email' }})
            .populate('company', 'name')
            .skip((page - 1) * limit)
            .limit(limit);

        res.status(200).json({ success: true, message: 'Assigned students retrieved', data: { count: internships.length, page, internships }});
    } catch (err) {
        next(err);
    }
};

// @desc    Comment on a student logbook
// @route   PUT /api/advisor/logbook/:id/comment
// @access  Private (ADVISOR only)
exports.commentOnLogbook = async (req, res, next) => {
    try {
        const { text } = req.body;
        const logbook = await Logbook.findById(req.params.id).populate('student');

        if (!logbook) return res.status(404).json({ success: false, message: 'Logbook not found', data: null });

        // Ensure this advisor actually advises this student
        const internship = await Internship.findOne({ student: logbook.student._id, advisor: req.user.id });
        if (!internship) return res.status(403).json({ success: false, message: 'Not authorized: Student not assigned to you.', data: null });

        logbook.comment = {
            text,
            advisor: req.user.id,
            dateAdded: new Date()
        };
        await logbook.save();

        // Dispatch notification directly to student
        await Notification.create({
            user: logbook.student.user,
            message: `Your advisor added a comment to your logbook entry on ${logbook.date.toLocaleDateString()}`,
            type: 'FEEDBACK'
        });

        res.status(200).json({ success: true, message: 'Comment added', data: logbook });
    } catch (err) {
        next(err);
    }
};

// @desc    Review and Grade a Report
// @route   PUT /api/advisor/report/:id/grade
// @access  Private (ADVISOR only)
exports.gradeReport = async (req, res, next) => {
    try {
        const { comment, approved } = req.body;
        const report = await Report.findById(req.params.id).populate('student');

        if (!report) return res.status(404).json({ success: false, message: 'Report not found', data: null });

        // RBAC validation
        const internship = await Internship.findOne({ student: report.student._id, advisor: req.user.id });
        if (!internship) return res.status(403).json({ success: false, message: 'Not authorized: Student not assigned to you.', data: null });

        report.feedback = { comment, advisor: req.user.id, dateAdded: new Date() };
        report.approved = approved;
        await report.save();

        // Dispatch feedback tag
        await Notification.create({
            user: report.student.user,
            message: `Your advisor graded your ${report.type} report. Approved: ${approved}.`,
            type: 'FEEDBACK',
            actionUrl: `/reports/view/${report._id}`
        });

        // Trigger Final Workflow step if final report is approved
        if (report.type === 'FINAL' && approved === true) {
            internship.status = 'GRADED';
            await internship.save();
        }

        res.status(200).json({ success: true, message: 'Report graded', data: report });
    } catch (err) {
        next(err);
    }
};
