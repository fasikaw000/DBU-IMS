import Internship from '../models/Internship.js';
import Student from '../models/Student.js';
import Company from '../models/Company.js';
import Placement from '../models/Placement.js';
import Report from '../models/Report.js';
import Evaluation from '../models/Evaluation.js';
import { notify } from './notificationController.js';
import User from '../models/User.js';

// @desc    Apply for internship
// @route   POST /api/internships/apply
// @access  Private/Student
export const applyInternship = async (req, res, next) => {
  try {
    const {
      companyName, company_name,
      country, city, subcity, location,
      field,
      supervisorName, supervisor_name, companySupervisorName,
      supervisorEmail, supervisor_email, companySupervisorEmail,
      supervisorPhone, supervisor_phone, companySupervisorPhone,
      startDate, start_date,
      endDate, end_date
    } = req.body;

    const finalCompanyName = companyName || company_name;
    const finalCountry = country || 'Ethiopia';
    const finalCity = city || location || 'N/A';
    const finalSubcity = subcity || '';
    const finalSupervisorName = supervisorName || supervisor_name || companySupervisorName;
    const finalSupervisorEmail = supervisorEmail || supervisor_email || companySupervisorEmail;
    const finalSupervisorPhone = supervisorPhone || supervisor_phone || companySupervisorPhone;
    const finalStartDate = startDate || start_date;
    const finalEndDate = endDate || end_date;

    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    const existingInternship = await Internship.findOne({ student: student._id });
    if (existingInternship && !['PENDING', 'PENDING_APPROVAL', 'RESUBMITTED', 'REVISION_REQUIRED', 'REJECTED'].includes(existingInternship.status)) {
      return res.status(400).json({ success: false, message: 'Active internship already exists' });
    }

    let company = await Company.findOne({ name: finalCompanyName });
    if (!company) {
      company = await Company.create({
        name: finalCompanyName,
        country: finalCountry,
        city: finalCity,
        subcity: finalSubcity,
        createdByStudent: true,
        addedBy: req.user.id
      });
    }

    let internship;
    if (existingInternship) {
      existingInternship.company = company._id;
      existingInternship.field = field;
      existingInternship.startDate = finalStartDate;
      existingInternship.endDate = finalEndDate;
      existingInternship.companySupervisorName = finalSupervisorName;
      existingInternship.companySupervisorEmail = finalSupervisorEmail;
      existingInternship.companySupervisorPhone = finalSupervisorPhone;
      
      if (existingInternship.status === 'REVISION_REQUIRED' || existingInternship.status === 'REJECTED') {
        existingInternship.status = 'RESUBMITTED';
      }
      internship = await existingInternship.save();
    } else {
      internship = await Internship.create({
        student: student._id,
        company: company._id,
        field,
        startDate: finalStartDate,
        endDate: finalEndDate,
        companySupervisorName: finalSupervisorName,
        companySupervisorEmail: finalSupervisorEmail,
        companySupervisorPhone: finalSupervisorPhone,
        status: 'PENDING'
      });
    }

    res.status(201).json({ success: true, message: 'Application submitted', data: internship });

    // Notify Department Dean
    if (student.department) {
      const deans = await User.find({ 
        role: 'Dean', 
        department: student.department,
        isActive: true 
      });
      
      for (const dean of deans) {
        await notify(
          dean._id,
          'NEW_INTERNSHIP_APPLICATION',
          `New internship application submitted by ${req.user.fullName || req.user.name}.`,
          '/dept-dashboard'
        );
      }
    }

  } catch (error) {
    next(error);
  }
};

// @desc    Approve internship
// @route   PUT /api/internships/:id/approve
// @access  Private/Department Head
export const approveInternship = async (req, res, next) => {
  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship not found' });
    }

    internship.status = 'APPROVED';
    await internship.save();

    const student = await Student.findById(internship.student);
    if (student && student.user) {
      await notify(student.user, 'APPLICATION_APPROVED', `Internship application approved!`, `/student-dashboard`);
    }

    res.status(200).json({ success: true, message: 'Internship approved', data: internship });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject internship
// @route   PUT /api/internships/:id/reject
// @access  Private/Department Dean
export const rejectInternship = async (req, res, next) => {
  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship not found' });
    }

    internship.status = 'REJECTED';
    await internship.save();

    res.status(200).json({ success: true, message: 'Internship rejected', data: internship });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all pending internships
// @access  Private/Department Dean
export const getPendingInternships = async (req, res, next) => {
  try {
    const internships = await Internship.find({ status: { $in: ['PENDING', 'PENDING_APPROVAL', 'RESUBMITTED'] } })
      .populate('student')
      .populate('company');

    res.status(200).json({ success: true, count: internships.length, data: internships });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign advisor to internship
// @route   PUT /api/internships/:id/assign-advisor
// @access  Private/Department Head
export const assignAdvisor = async (req, res, next) => {
  try {
    const { advisor_id } = req.body;
    const internship = await Internship.findById(req.params.id);
    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship not found' });
    }

    const advisor = await User.findById(advisor_id);
    if (!advisor) {
      return res.status(400).json({ success: false, message: 'Invalid advisor' });
    }

    internship.advisor_id = advisor_id;
    await internship.save();

    await notify(advisor_id, 'ADVISOR_ASSIGNED', 'New internship assigned to you.', `/advisor-dashboard`);

    res.status(200).json({ success: true, message: 'Advisor assigned', data: internship });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in student's internship
// @route   GET /api/internships/my-internship
// @access  Private/Student
export const getStudentInternship = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const internship = await Internship.findOne({ student: student._id })
      .populate('company')
      .populate('advisor_id', 'fullName email');

    res.status(200).json({ success: true, data: internship });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload company evaluation
// @route   POST /api/internships/upload-evaluation
// @access  Private/Student
export const uploadEvaluation = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    const internship = await Internship.findOne({ student: student._id });
    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship not found' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    internship.companyEvaluationUrl = fileUrl;
    await internship.save();

    if (internship.advisor_id) {
      await notify(internship.advisor_id, 'EVALUATION_SUBMITTED', `Student ${req.user.fullName || req.user.name} uploaded evaluation.`, `/advisor-dashboard`);
    }

    res.status(200).json({ success: true, message: 'Uploaded', data: { url: fileUrl } });
  } catch (error) {
    next(error);
  }
};

// @desc    Check and finalize internship completion
export const checkAndCompleteInternship = async (internshipId) => {
  const internship = await Internship.findById(internshipId);
  if (!internship) return { success: false, message: 'Not found' };

  const weeklyReports = await Report.countDocuments({ internship: internshipId, type: 'WEEKLY' });
  if (weeklyReports === 0) return { success: false, message: 'Weekly reports missing' };

  const finalReport = await Report.findOne({ internship: internshipId, type: 'FINAL' });
  if (!finalReport) return { success: false, message: 'Final report missing' };

  if (!internship.companyEvaluationUrl) return { success: false, message: 'Evaluation missing' };
  if (!internship.presentationCompleted) return { success: false, message: 'Presentation missing' };
  if (!internship.finalGrade || !internship.finalGrade.total) return { success: false, message: 'Grades missing' };

  internship.status = 'COMPLETED';
  await internship.save();
  return { success: true };
};
