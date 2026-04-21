import express from 'express';
import multer from 'multer';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  createStudent,
  createStaff,
  getAllUsers,
  createDepartment,
  getDepartments,
  getAdminStats,
  seedStudentIds,
  emergencyAdminReset,
  getAuthorizedStudentIds,
  bulkUploadStudents,
  getAllStudents,
  getAllStaff,
  bulkUploadStaff,
  updateDepartment,
  toggleDepartmentStatus,
  deleteDepartment,
  updateStudent,
  updateStaff,
  toggleUserStatus,
  getAllInternships,
  updateInternshipStatus,
  getInternshipDashboardStats,
  getReportAnalytics,
  getSettings,
  updateSettings,
  getLogs
} from '../controllers/adminController.js';

const router = express.Router();
const bulkStudentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Emergency Admin Recovery (Public Route)
router.post('/reset-admin', emergencyAdminReset);

// All routes require user to be logged in and strictly be a 'college_admin'
router.use(protect);
router.use(authorize('Admin'));

// User Management
router.post('/student', createStudent);
router.post('/staff', createStaff);
router.get('/users', getAllUsers);
router.patch('/users/:id/status', toggleUserStatus);
router.get('/stats', getAdminStats);
router.post('/seed-ids', seedStudentIds);
router.get('/authorized-ids', getAuthorizedStudentIds);
router.get('/students', getAllStudents);
router.put('/students/:id', updateStudent);
router.post('/students/bulk-upload', bulkStudentUpload.single('file'), bulkUploadStudents);

// Staff Management
router.get('/staff', getAllStaff);
router.put('/staff/:id', updateStaff);
router.post('/staff/bulk-upload', bulkStudentUpload.single('file'), bulkUploadStaff);

// Department Management
router.route('/departments')
  .post(createDepartment)
  .get(getDepartments);

router.route('/departments/:id')
  .put(updateDepartment)
  .patch(toggleDepartmentStatus)
  .delete(deleteDepartment);

// Internship Management
router.get('/internships', getAllInternships);
router.patch('/internships/:id/status', updateInternshipStatus);
router.get('/internships/dashboard-stats', getInternshipDashboardStats);

// System Reports
router.get('/reports/analytics', getReportAnalytics);

// System Settings
router.route('/settings')
  .get(getSettings)
  .put(updateSettings);

// Audit Logs
router.get('/logs', getLogs);

export default router;
