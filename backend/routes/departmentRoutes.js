import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getDepartmentStudents,
  processInternshipApp,
  assignAdvisor,
  getAdvisorWorkload,
  getDepartmentStats,
  getInternshipHistory
} from '../controllers/departmentController.js';
import {
  getCompanies,
  createCompany,
  updateCompany,
  toggleCompanyStatus,
  deleteCompany,
  approveCompany,
  getCompanyPlacements
} from '../controllers/companyController.js';

const router = express.Router();

router.use(protect);
// router.use(authorize('Dean')); // Moved down for specific routes

router.get('/students', authorize('Dean'), getDepartmentStudents);
router.get('/advisors/workload', authorize('Dean'), getAdvisorWorkload);
router.get('/stats', authorize('Dean'), getDepartmentStats);
router.put('/internship/:internshipId', authorize('Dean'), processInternshipApp);
router.put('/internship/:internshipId/advisor', authorize('Dean'), assignAdvisor);
router.get('/internship/:internshipId/history', authorize('Dean'), getInternshipHistory);

// Companies management
router.get('/companies', authorize('Dean', 'Student'), getCompanies);
router.post('/companies', authorize('Dean'), createCompany);
router.put('/companies/:id', authorize('Dean'), updateCompany);
router.patch('/companies/:id/status', authorize('Dean'), toggleCompanyStatus);
router.patch('/companies/:id/approve', authorize('Dean'), approveCompany);
router.delete('/companies/:id', authorize('Dean'), deleteCompany);
router.get('/companies/:id/placements', authorize('Dean'), getCompanyPlacements);

export default router;
