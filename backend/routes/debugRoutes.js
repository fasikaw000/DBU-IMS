import express from 'express';
import User from '../models/User.js';
import Student from '../models/Student.js';
import seedDatabase from '../utils/seeder.js';

const router = express.Router();

router.get('/users', async (req, res) => {
  try {
    const mongoose = (await import('mongoose')).default;
    const users = await User.find({}, 'username name role isActivated');
    const students = await Student.find({}, 'username studentId');
    res.json({ database: mongoose.connection.name, users, students });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/force-seed', async (req, res) => {
  try {
    await seedDatabase();
    res.json({ success: true, message: 'Seeder triggered via Debug API' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
