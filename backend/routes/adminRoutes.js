import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  createStudent,
  createStaff,
  getAllUsers,
  createDepartment,
  getDepartments,
  emergencyAdminReset
} from '../controllers/adminController.js';

const router = express.Router();

// Emergency Admin Recovery (Public Route)
router.post('/reset-admin', emergencyAdminReset);

// All routes require user to be logged in and strictly be a 'college_admin'
router.use(protect);
router.use(authorize('college_admin'));

// User Management
router.post('/student', createStudent);
router.post('/staff', createStaff);
router.get('/users', getAllUsers);

// Department Management
router.route('/departments')
  .post(createDepartment)
  .get(getDepartments);

export default router;
