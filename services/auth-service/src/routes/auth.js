const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const oauthController = require('../controllers/oauthController');
const cookieParser = require('cookie-parser');

router.use(cookieParser());

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

router.get('/verify', authController.verifyToken);

router.get('/oauth/github', oauthController.githubLogin);
router.get('/oauth/github/callback', oauthController.githubCallback);
module.exports = router;