const express = require('express');
const { provisionStaff, getUsers } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes here are strictly protected and only for Dean 
router.use(protect);
router.use(authorize('COLLEGE_DEAN'));

router.post('/provision', provisionStaff);
router.route('/users').get(getUsers);

module.exports = router;
