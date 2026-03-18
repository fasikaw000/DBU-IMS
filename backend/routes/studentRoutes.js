const express = require('express');
const { applyForInternship, submitLogbook, submitReport, getMyLogbooks } = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('STUDENT'));

router.post('/apply', applyForInternship);
router.route('/logbook')
    .post(submitLogbook)
    .get(getMyLogbooks);
router.post('/reports', submitReport);

module.exports = router;
