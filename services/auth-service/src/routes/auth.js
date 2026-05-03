const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const oauthController= require('../controllers/oauthController');
const cookieParser = require('cookie-parser');

router.use(cookieParser());

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/verify', authController.verifyToken);
router.get('/github', oauthController.githubRedirect);
router.get('/github/callback', oauthController.githubCallback);

module.exports = router;