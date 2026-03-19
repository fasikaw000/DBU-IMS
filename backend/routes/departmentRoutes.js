import express from 'express';
import { approveCompany, assignAdvisor } from '../controllers/departmentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);
router.use(authorize('DEPARTMENT_HEAD'));

router.put('/company/:id/approve', approveCompany);
router.put('/internship/:id/assign', assignAdvisor);

export default router;
