const express = require('express');
const { getAssignedStudents, commentOnLogbook, gradeReport } = require('../controllers/advisorController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);
router.use(authorize('ADVISOR'));

router.get('/students', getAssignedStudents);
router.put('/logbook/:id/comment', commentOnLogbook);
router.put('/report/:id/grade', gradeReport);

module.exports = router;
