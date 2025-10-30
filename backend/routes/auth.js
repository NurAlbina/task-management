const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

// http://localhost:5000/api/auth/register adresine POST isteği gelirse
router.post('/register', registerUser);

// http://localhost:5000/api/auth/login adresine POST isteği gelirse
router.post('/login', loginUser);

module.exports = router;