const Student = require('../models/Student');
const Internship = require('../models/Internship');
const Company = require('../models/Company');
const Report = require('../models/Report');
const Logbook = require('../models/Logbook');

// @desc    Student proposes a company & applies for internship
// @route   POST /api/student/apply
// @access  Private (STUDENT only)
exports.applyForInternship = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user.id });

    // Check if student already has an active workflow
    let internship = await Internship.findOne({ student: student._id });
    if (internship) {
      return res.status(400).json({ success: false, message: `Internship already exists at status: ${internship.status}`, data: null });
    }

    const { companyName, location, industry, field, startDate, endDate, companySupervisorName, companySupervisorPhone } = req.body;

    // Create the Company as a student-proposed entity (Needs Dept Auth later)
    const company = await Company.create({
      name: companyName,
      location,
      industry,
      createdByStudent: true,
      addedBy: req.user.id
    });

    // Create Internship (Status automatically sets to PENDING_APPROVAL)
    internship = await Internship.create({
      student: student._id,
      company: company._id,
      field,
      startDate,
      endDate,
      companySupervisorName,
      companySupervisorPhone
    });

    res.status(201).json({
      success: true,
      message: 'Internship application submitted and is pending department approval.',
      data: internship
    });

  } catch (err) {
    next(err);
  }
};

// @desc    Submit a daily/weekly logbook entry
// @route   POST /api/student/logbook
// @access  Private (STUDENT only)
exports.submitLogbook = async (req, res, next) => {
  try {
    const { activity, hoursWorked } = req.body;
    const student = await Student.findOne({ user: req.user.id });
    const internship = await Internship.findOne({ student: student._id });

    if (!internship || internship.status !== 'ONGOING') {
      return res.status(403).json({ success: false, message: 'You can only submit logbooks during an ONGOING internship.', data: null });
    }

    const logbook = await Logbook.create({
      student: student._id,
      internship: internship._id,
      activity,
      hoursWorked
    });

    res.status(201).json({ success: true, message: 'Logbook entry added', data: logbook });
  } catch (err) {
    next(err);
  }
};

// @desc    Submit a Report (Weekly, Monthly, Final) w/ Versioning & Deadlines
// @route   POST /api/student/reports
// @access  Private (STUDENT only)
exports.submitReport = async (req, res, next) => {
  try {
    const { type, fileUrl, dueDate } = req.body;
    const student = await Student.findOne({ user: req.user.id });
    const internship = await Internship.findOne({ student: student._id });

    if (!internship || !['ONGOING', 'COMPLETED'].includes(internship.status)) {
        return res.status(403).json({ success: false, message: 'Invalid internship status for reporting.', data: null });
    }

    // Versioning logic: Check if a report of this type already exists
    const existingReports = await Report.find({ student: student._id, type });
    let version = 1;

    if (existingReports.length > 0) {
      version = existingReports.length + 1;
      // Mark all previous as not latest
      await Report.updateMany({ student: student._id, type }, { $set: { isLatest: false }});
    }

    // `isLate` flag is handled automatically by the mongoose `pre('save')` middleware based on dueDate
    const report = await Report.create({
      student: student._id,
      internship: internship._id,
      type,
      fileUrl, // Provided by frontend Cloudinary upload
      dueDate, 
      version,
      isLatest: true
    });

    res.status(201).json({ success: true, message: `${type} Report submitted (v${version})`, data: report });
  } catch (err) {
    next(err);
  }
};

// @desc    Get paginated logbooks for the current student
// @route   GET /api/student/logbook
// @access  Private (STUDENT only)
exports.getMyLogbooks = async (req, res, next) => {
    try {
        const student = await Student.findOne({ user: req.user.id });
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const startIndex = (page - 1) * limit;

        const total = await Logbook.countDocuments({ student: student._id });
        const logbooks = await Logbook.find({ student: student._id })
            .sort({ date: -1 })
            .skip(startIndex)
            .limit(limit);

        res.status(200).json({ success: true, message: 'Logbooks retrieved', data: { count: logbooks.length, total, page, logbooks } });
    } catch (err) {
        next(err);
    }
}
