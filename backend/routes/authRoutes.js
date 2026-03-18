const express = require('express');
const { login, registerStudent } = require('../controllers/authController');

const router = express.Router();

router.post('/login', login);
router.post('/register/student', registerStudent);

module.exports = router;
