// src/services/authService.js
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const tokenService = require('./tokenService');

const authService = {
  async register({ username, email, password }) {
    const exists = User.findByEmailOrUsername(email, username);
    if (exists) {
      const error = new Error('Email atau username sudah digunakan.');
      error.statusCode = 409;
      throw error;
    }

    const hashed = await bcrypt.hash(password, 12);
    const result = User.create(username, email, hashed);

    const user = { id: result.lastInsertRowid, email, role: 'user' };
    const accessToken = tokenService.generateAccessToken(user);
    const refreshToken = tokenService.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, username, email, role: 'user' }
    };
  },

  async login({ email, password }) {
    const user = User.findByEmail(email);
    if (!user || !user.password) {
      const error = new Error('Email atau password salah.');
      error.statusCode = 401;
      throw error;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      const error = new Error('Email atau password salah.');
      error.statusCode = 401;
      throw error;
    }

    const accessToken = tokenService.generateAccessToken(user);
    const refreshToken = tokenService.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    };
  },

  refresh(rawToken) {
    if (!rawToken) {
      const error = new Error('Refresh token tidak ditemukan.');
      error.statusCode = 401;
      throw error;
    }

    const record = tokenService.verifyRefreshToken(rawToken);
    if (!record) {
      const error = new Error('Refresh token tidak valid atau sudah expired.');
      error.statusCode = 401;
      throw error;
    }

    tokenService.revokeRefreshToken(rawToken);
    const user = { id: record.uid, email: record.email, role: record.role };
    const accessToken = tokenService.generateAccessToken(user);
    const newRefreshToken = tokenService.generateRefreshToken(user.id);

    return { accessToken, newRefreshToken };
  },

  logout(rawToken) {
    if (rawToken) {
      tokenService.revokeRefreshToken(rawToken);
    }
  }
};

module.exports = authService;