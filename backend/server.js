require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Connect Database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Route files
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const advisorRoutes = require('./routes/advisorRoutes');
const departmentRoutes = require('./routes/departmentRoutes');

// Mount Routers
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/advisor', advisorRoutes);
app.use('/api/department', departmentRoutes);

// Basic Route for testing
app.get('/', (req, res) => {
    res.json({ success: true, message: 'DBU-IMS API is running', data: null });
});

// Standardized 404 Error handler
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'Endpoint not found', data: null });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT} in ${process.env.NODE_ENV} mode.`));
