const authService = require('../services/authService');
const jwt = require('jsonwebtoken');

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const authController = {
  async register(req, res) {
    try {
      const result = await authService.register(req.body);

      res.cookie('refreshToken', result.refreshToken, COOKIE_OPTS);
      res.status(201).json({
        success: true,
        message: 'Registrasi berhasil.',
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (error) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, message: error.message });
    }
  },

  async login(req, res) {
    try {
      const result = await authService.login(req.body);

      res.cookie('refreshToken', result.refreshToken, COOKIE_OPTS);
      res.json({
        success: true,
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (error) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, message: error.message });
    }
  },

  refresh(req, res) {
    try {
      const rawToken = req.cookies?.refreshToken;
      const result = authService.refresh(rawToken);

      res.cookie('refreshToken', result.newRefreshToken, COOKIE_OPTS);
      res.json({ success: true, accessToken: result.accessToken });
    } catch (error) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, message: error.message });
    }
  },

  logout(req, res) {
    try {
      const rawToken = req.cookies?.refreshToken;
      authService.logout(rawToken);

      res.clearCookie('refreshToken');
      res.json({ success: true, message: 'Logout berhasil.' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Terjadi kesalahan saat logout.' });
    }
  },

  verifyToken(req, res) {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    
    if (!token) return res.status(401).json({ valid: false });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      res.json({ valid: true, user: decoded });
    } catch {
      res.status(401).json({ valid: false });
    }
  },
};

module.exports = authController;