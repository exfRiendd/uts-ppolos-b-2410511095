const bcrypt       = require('bcryptjs');
const db           = require('../config/database');
const tokenService = require('../services/tokenService');

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge:   7 * 24 * 60 * 60 * 1000,
};

const authController = {
  async register(req, res) {
    const { username, email, password } = req.body;

    const exists = db.prepare(
      'SELECT id FROM users WHERE email = ? OR username = ?'
    ).get(email, username);

    if (exists) {
      return res.status(409).json({
        success: false,
        message: 'Email atau username sudah digunakan.',
      });
    }

    const hashed = await bcrypt.hash(password, 12);
    const result = db.prepare(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)'
    ).run(username, email, hashed);

    const user = { id: result.lastInsertRowid, email, role: 'user' };

    const accessToken  = tokenService.generateAccessToken(user);
    const refreshToken = tokenService.generateRefreshToken(user.id);

    res.cookie('refreshToken', refreshToken, COOKIE_OPTS);
    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil.',
      accessToken,
      user: { id: user.id, username, email, role: 'user' },
    });
  },

  async login(req, res) {
    const { email, password } = req.body;

    const user = db.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).get(email);

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.',
      });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.',
      });
    }

    const accessToken  = tokenService.generateAccessToken(user);
    const refreshToken = tokenService.generateRefreshToken(user.id);

    res.cookie('refreshToken', refreshToken, COOKIE_OPTS);
    res.json({
      success: true,
      accessToken,
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
    });
  },

  refresh(req, res) {
    const rawToken = req.cookies?.refreshToken;
    if (!rawToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token tidak ditemukan.',
      });
    }

    const record = tokenService.verifyRefreshToken(rawToken);
    if (!record) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token tidak valid atau sudah expired.',
      });
    }

    tokenService.revokeRefreshToken(rawToken);

    const user = { id: record.uid, email: record.email, role: record.role };
    const accessToken     = tokenService.generateAccessToken(user);
    const newRefreshToken = tokenService.generateRefreshToken(user.id);

    res.cookie('refreshToken', newRefreshToken, COOKIE_OPTS);
    res.json({ success: true, accessToken });
  },

  logout(req, res) {
    const rawToken = req.cookies?.refreshToken;
    if (rawToken) tokenService.revokeRefreshToken(rawToken);

    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logout berhasil.' });
  },

  verifyToken(req, res) {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    if (!token) return res.status(401).json({ valid: false });

    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      res.json({ valid: true, user: decoded });
    } catch {
      res.status(401).json({ valid: false });
    }
  },
};

module.exports = authController;