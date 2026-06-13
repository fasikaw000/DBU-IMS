import dotenv from 'dotenv';
dotenv.config({ override: true });
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import advisorRoutes from './routes/advisorRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import communicationRoutes from './routes/communicationRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import internshipRoutes from './routes/internshipRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import logbookRoutes from './routes/logbookRoutes.js';
import evaluationRoutes from './routes/evaluationRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import userRoutes from './routes/userRoutes.js';
import seedDatabase from './utils/seeder.js';
import debugRoutes from './routes/debugRoutes.js';
import morgan from 'morgan';
import errorHandler from './middleware/error.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env from backend directory is loaded (explicit)
dotenv.config({ path: path.join(__dirname, '.env') });

const extractHostFromUri = (uri) => {
  try {
    const m = uri.match(/mongodb(?:\+srv)?:\/\/(?:[^@]+@)?([^\/]+)/);
    return m ? m[1] : 'unknown';
  } catch (e) {
    return 'unknown';
  }
};

// Connect to MongoDB and start server only after successful DB connection
const dbConnection = await connectDB();
const databaseName = (dbConnection && dbConnection.name) || process.env.DB_NAME || 'unknown';
const hostName = extractHostFromUri(process.env.MONGO_URI || '');

// Seed database (runs after DB connection)
await seedDatabase();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan('dev')); // Added for better request visibility

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/advisor', advisorRoutes);
app.use('/api/department', departmentRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/logbooks', logbookRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/debug', debugRoutes);

// Static folders
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic route for testing
app.get('/', (req, res) => {
  res.send('API is running (ES Modules)...');
});

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('✅ MongoDB Connected Successfully');
  console.log(`📦 Database: ${databaseName}`);
  console.log(`🌐 Host: ${hostName}`);
  console.log(`🚀 Server running on port ${PORT}`);
});
