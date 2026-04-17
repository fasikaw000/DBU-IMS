import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getDepartmentStudents,
  processInternshipApp,
  assignAdvisor,
  getAdvisorWorkload
} from '../controllers/departmentController.js';

const router = express.Router();

router.use(protect);
router.use(authorize('department_dean'));

router.get('/students', getDepartmentStudents);
router.get('/advisors/workload', getAdvisorWorkload);
router.put('/internship/:internshipId', processInternshipApp);
router.put('/internship/:internshipId/advisor', assignAdvisor);

export default router;
