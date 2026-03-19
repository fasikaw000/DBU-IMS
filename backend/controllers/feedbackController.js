import Report from '../models/Report.js';
import Internship from '../models/Internship.js';

// @desc    Add feedback to a report
// @route   POST /api/feedback/add/:reportId
// @access  Private/Advisor
export const addFeedback = async (req, res) => {
  try {
    const { feedback } = req.body;
    const report = await Report.findById(req.params.reportId);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Verify advisor is assigned to this student's internship
    const internship = await Internship.findById(report.internship_id);
    if (!internship || internship.advisor_id?.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized: This student is not assigned to you' });
    }

    report.advisor_feedback = feedback;
    report.feedback_date = Date.now();
    await report.save();

    res.status(200).json({ success: true, message: 'Feedback added successfully', data: report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc    Get feedback for a specific report
// @route   GET /api/feedback/my-reports/:reportId
// @access  Private/Student
export const getReportFeedback = async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Verify report belongs to student
    if (report.student_id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({
      success: true,
      data: {
        feedback: report.advisor_feedback,
        date: report.feedback_date
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};
