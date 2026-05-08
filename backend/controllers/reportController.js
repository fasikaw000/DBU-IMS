import Report from '../models/Report.js';
import Internship from '../models/Internship.js';
import Student from '../models/Student.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { notify } from './notificationController.js';


// Multer Config for reports
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/reports';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `report-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || 
      file.mimetype === 'application/msword' || 
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'), false);
  }
};

export const upload = multer({ storage, fileFilter });

// @desc    Upload a weekly report
// @route   POST /api/reports/upload
// @access  Private/Student
export const uploadReport = async (req, res, next) => {
  try {
    const { type, dueDate } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    const internship = await Internship.findOne({ student: student._id });
    if (!internship) {
      return res.status(404).json({ success: false, message: 'No active internship found' });
    }

    const report = await Report.create({
      student: student._id,
      internship: internship._id,
      type: type || 'WEEKLY',
      fileUrl: `/uploads/reports/${req.file.filename}`,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status: 'Pending'
    });

    res.status(201).json({
      success: true,
      message: 'Report uploaded successfully',
      data: report
    });

    // Notify Advisor
    if (internship.advisor_id) {
      await notify(
        internship.advisor_id,
        'REPORT_SUBMITTED',
        `Student ${req.user.fullName || req.user.name} has submitted a new ${type || 'WEEKLY'} report.`,
        `/advisor-dashboard`
      );
    }

  } catch (error) {
    next(error);
  }
};

// @desc    Get student's reports
// @route   GET /api/reports/my-reports
// @access  Private/Student
export const getStudentReports = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }
    const reports = await Report.find({ student: student._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    next(error);
  }
};

// @desc    Get advisor's assigned reports
// @route   GET /api/reports/advisor-reports
// @access  Private/Advisor
export const getAdvisorReports = async (req, res, next) => {
  try {
    const internships = await Internship.find({ advisor_id: req.user.id });
    const internshipIds = internships.map(i => i._id);

    const reports = await Report.find({ internship: { $in: internshipIds } })
      .populate('student', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve a report
// @route   PUT /api/reports/:id/approve
// @access  Private/Advisor
export const approveReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const internship = await Internship.findById(report.internship);
    if (!internship || internship.advisor_id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    report.status = 'Approved';
    await report.save();

    res.status(200).json({ success: true, message: 'Report approved', data: report });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a report
// @route   PUT /api/reports/:id/reject
// @access  Private/Advisor
export const rejectReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const internship = await Internship.findById(report.internship);
    if (!internship || internship.advisor_id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    report.status = 'Revision Required';
    await report.save();

    res.status(200).json({ success: true, message: 'Report rejected', data: report });
  } catch (error) {
    next(error);
  }
};
