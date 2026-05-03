import Logbook from '../models/Logbook.js';
import Internship from '../models/Internship.js';
import Student from '../models/Student.js';

// @desc    Submit a daily logbook entry
// @route   POST /api/logbooks/submit
// @access  Private/Student
export const submitLogbook = async (req, res) => {
  try {
    const { date, activity, tasksCompleted, problemsFaced, hoursWorked } = req.body;

    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    const internship = await Internship.findOne({ student: student._id });
    if (!internship) {
      return res.status(404).json({ success: false, message: 'Active internship not found' });
    }

    const logbook = await Logbook.create({
      student: student._id,
      internship: internship._id,
      date,
      activity,
      tasksCompleted,
      problemsFaced,
      hoursWorked
    });

    res.status(201).json({
      success: true,
      message: 'Logbook entry submitted successfully',
      data: logbook
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc    Get student's own logbooks
// @route   GET /api/logbooks/my-logbooks
// @access  Private/Student
export const getStudentLogbooks = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    const logbooks = await Logbook.find({ student: student?._id }).sort({ date: -1 });
    res.status(200).json({ success: true, count: logbooks.length, data: logbooks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc    Get advisor's assigned students' logbooks
// @route   GET /api/logbooks/assigned-logbooks
// @access  Private/Advisor
export const getAssignedStudentLogbooks = async (req, res) => {
  try {
    const { studentId } = req.query;
    // Find internships assigned to this advisor
    const internships = await Internship.find({ advisor_id: req.user.id }).select('_id');
    const internshipIds = internships.map(i => i._id);

    let query = { internship: { $in: internshipIds } };

    if (studentId) {
      query.student = studentId;
    }

    const logbooks = await Logbook.find(query)
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email' }
      })
      .sort({ date: -1 });

    res.status(200).json({ success: true, count: logbooks.length, data: logbooks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc    Add comment to logbook entry
// @route   POST /api/logbooks/:id/comment
// @access  Private/Advisor
export const addLogbookComment = async (req, res) => {
  try {
    const { text } = req.body;
    const logbook = await Logbook.findById(req.params.id);

    if (!logbook) {
      return res.status(404).json({ success: false, message: 'Logbook entry not found' });
    }

    logbook.comment = {
      text,
      advisor: req.user.id,
      dateAdded: Date.now()
    };

    await logbook.save();

    res.status(200).json({ success: true, message: 'Comment added', data: logbook });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};
