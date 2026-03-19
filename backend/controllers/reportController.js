import Report from '../models/Report.js';
import Internship from '../models/Internship.js';
import Student from '../models/Student.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { notify } from './notificationController.js';

// @desc    Setup Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/reports';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and DOCX files are allowed'), false);
  }
};

export const upload = multer({ storage, fileFilter });

// @desc    Upload a weekly report
// @route   POST /api/reports/upload
// @access  Private/Student
export const uploadReport = async (req, res) => {
  try {
    const { title, description, week_number } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    // 1. Find student record for the user
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    // 2. Find student's active internship
    const internship = await Internship.findOne({ student: student._id });
    if (!internship) {
      return res.status(404).json({ success: false, message: 'No active internship found for this student' });
    }

    // 3. Create report
    const report = await Report.create({
      student_id: req.user.id,
      internship_id: internship._id,
      title,
      description,
      file: req.file.path,
      week_number,
      status: 'submitted'
    });

    // Notify advisor
    if (internship.advisor_id) {
        await notify(
            internship.advisor_id, 
            'report_submitted', 
            `Student ${req.user.name} submitted a report for Week ${week_number}.`,
            `/advisor/reports`
        );
    }

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: report
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc    Get student's reports
// @route   GET /api/reports/my-reports
// @access  Private/Student
export const getStudentReports = async (req, res) => {
  try {
    const reports = await Report.find({ student_id: req.user.id }).sort({ week_number: -1 });
    res.status(200).json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc    Get advisor's assigned reports
// @route   GET /api/reports/advisor-reports
// @access  Private/Advisor
export const getAdvisorReports = async (req, res) => {
  try {
    // 1. Find internships assigned to this advisor
    const internships = await Internship.find({ advisor_id: req.user.id });
    const internshipIds = internships.map(i => i._id);

    // 2. Find reports for these internships
    const reports = await Report.find({ internship_id: { $in: internshipIds } })
      .populate('student_id', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc    Approve a report
// @route   PUT /api/reports/:id/approve
// @access  Private/Advisor
export const approveReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Authorization check
    const internship = await Internship.findById(report.internship_id);
    if (!internship || internship.advisor_id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    report.status = 'approved';
    await report.save();

    res.status(200).json({ success: true, message: 'Report approved', data: report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc    Reject a report
// @route   PUT /api/reports/:id/reject
// @access  Private/Advisor
export const rejectReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Authorization check
    const internship = await Internship.findById(report.internship_id);
    if (!internship || internship.advisor_id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    report.status = 'rejected';
    await report.save();

    res.status(200).json({ success: true, message: 'Report rejected', data: report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};
