import Logbook from '../models/Logbook.js';
import Internship from '../models/Internship.js';

// @desc    Submit a daily logbook entry
// @route   POST /api/logbooks/submit
// @access  Private/Student
export const submitLogbook = async (req, res) => {
  try {
    const { date, tasks_completed, hours_spent, remarks } = req.body;

    const logbook = await Logbook.create({
      student_id: req.user.id,
      date,
      tasks_completed,
      hours_spent,
      remarks
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
    const logbooks = await Logbook.find({ student_id: req.user.id }).sort({ date: -1 });
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
    // 1. Find internships assigned to this advisor
    const internships = await Internship.find({ advisor_id: req.user.id }).populate('student');
    
    // 2. Extract user IDs of assigned students (Internship.student refs Student.user ref User)
    const studentUserIds = internships.map(i => i.student?.user);

    // 3. Find logbooks for these students
    const logbooks = await Logbook.find({ student_id: { $in: studentUserIds } })
      .populate('student_id', 'name email')
      .sort({ date: -1 });

    res.status(200).json({ success: true, count: logbooks.length, data: logbooks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};
