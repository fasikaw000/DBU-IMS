const express = require('express');
const { approveCompany, assignAdvisor } = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);
router.use(authorize('DEPARTMENT_HEAD'));

router.put('/company/:id/approve', approveCompany);
router.put('/internship/:id/assign', assignAdvisor);

module.exports = router;
