import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getDepartmentStudents,
  processInternshipApp,
  assignAdvisor,
  getAdvisorWorkload,
  getDepartmentStats
} from '../controllers/departmentController.js';
import {
  getCompanies,
  createCompany,
  updateCompany,
  toggleCompanyStatus,
  deleteCompany
} from '../controllers/companyController.js';

const router = express.Router();

router.use(protect);
router.use(authorize('Dean'));

router.get('/students', getDepartmentStudents);
router.get('/advisors/workload', getAdvisorWorkload);
router.get('/stats', getDepartmentStats);
router.put('/internship/:internshipId', processInternshipApp);
router.put('/internship/:internshipId/advisor', assignAdvisor);

// Companies management
router.get('/companies', getCompanies);
router.post('/companies', createCompany);
router.put('/companies/:id', updateCompany);
router.patch('/companies/:id/status', toggleCompanyStatus);
router.delete('/companies/:id', deleteCompany);

export default router;
