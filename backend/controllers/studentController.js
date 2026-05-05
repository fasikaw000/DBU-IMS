import Student from '../models/Student.js';
import Internship from '../models/Internship.js';
import Company from '../models/Company.js';
import Report from '../models/Report.js';
import Logbook from '../models/Logbook.js';
import AuditLog from '../models/AuditLog.js';

// @desc    Student proposes a company & applies for internship
export const applyForInternship = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    let internship = await Internship.findOne({ student: student._id });
    if (internship) {
      return res.status(400).json({ success: false, message: `Internship already exists at status: ${internship.status}` });
    }

    const { companyName, location, industry, field, startDate, endDate, companySupervisorName, companySupervisorPhone, companySupervisorEmail } = req.body;

    const company = await Company.create({
      name: companyName,
      location,
      industry: industry || field,
      createdByStudent: true,
      addedBy: req.user.id
    });

    internship = await Internship.create({
      student: student._id,
      company: company._id,
      field,
      startDate,
      endDate,
      companySupervisorName,
      companySupervisorPhone,
      companySupervisorEmail,
      status: 'PENDING_APPROVAL'
    });

    res.status(201).json({
      success: true,
      message: 'Internship application submitted and is pending department approval.',
      data: internship
    });
  } catch (err) { next(err); }
};

// @desc    Submit a daily/weekly logbook entry
export const submitLogbook = async (req, res, next) => {
  try {
    const { activity, hoursWorked, tasksCompleted, problemsFaced, date } = req.body;
    const student = await Student.findOne({ user: req.user.id });
    const internship = await Internship.findOne({ student: student._id });

    if (!internship || !['APPROVED', 'ACTIVE', 'ONGOING', 'Approved', 'Active'].includes(internship.status)) {
      return res.status(403).json({ success: false, message: 'You can only submit logbooks for an approved or active internship.' });
    }

    const logbook = await Logbook.create({
      student: student._id,
      internship: internship._id,
      date: date || Date.now(),
      activity,
      hoursWorked,
      tasksCompleted,
      problemsFaced
    });

    res.status(201).json({ success: true, message: 'Logbook entry added', data: logbook });
  } catch (err) { next(err); }
};

// @desc    Submit a Report (Weekly, Monthly, Final) w/ Versioning & Deadlines
export const submitReport = async (req, res, next) => {
  try {
    const { type, dueDate } = req.body;
    let fileUrl = req.body.fileUrl;

    // Handle multer file upload
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
    }

    if (!type || !fileUrl) {
      return res.status(400).json({ success: false, message: 'Report type and file are required.' });
    }

    const student = await Student.findOne({ user: req.user.id });
    const internship = await Internship.findOne({ student: student._id });

    if (!internship) return res.status(403).json({ success: false, message: 'No internship found.' });

    const existingReports = await Report.find({ student: student._id, type });
    let version = 1;
    if (existingReports.length > 0) {
      version = existingReports.length + 1;
      await Report.updateMany({ student: student._id, type }, { $set: { isLatest: false } });
    }

    const report = await Report.create({
      student: student._id,
      internship: internship._id,
      type,
      fileUrl,
      dueDate,
      version,
      isLatest: true,
      status: 'Pending'
    });

    await AuditLog.create({
      user: req.user.id,
      action: 'report_submitted',
      details: `${type} report submitted (v${version})`,
      ip: req.ip
    });

    res.status(201).json({ 
      success: true, 
      message: `${type} Report submitted (v${version})`, 
      data: report,
      version,
      isLate: report.isLate
    });
  } catch (err) { next(err); }
};

// @desc    Get current student's reports
export const getMyReports = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    const reports = await Report.find({ student: student._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: reports.length, data: reports });
  } catch (err) { next(err); }
};

// @desc    Get paginated logbooks
export const getMyLogbooks = async (req, res, next) => {
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
  } catch (err) { next(err); }
};

// @desc    Update student profile
export const updateProfile = async (req, res, next) => {
  try {
    const { phone, cbeAccount } = req.body;
    const updateData = {};
    if (phone) updateData.phone = phone;
    if (cbeAccount) updateData.cbeAccount = cbeAccount;

    const student = await Student.findOneAndUpdate(
      { user: req.user.id },
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, message: 'Profile updated', data: student });
  } catch (err) { next(err); }
};

// @desc    Get student activity feed
export const getMyActivity = async (req, res, next) => {
  try {
    const logs = await AuditLog.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(20);
    res.status(200).json({ success: true, data: logs });
  } catch (err) { next(err); }
};
