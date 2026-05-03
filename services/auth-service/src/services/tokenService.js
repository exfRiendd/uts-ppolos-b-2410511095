// src/services/tokenService.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');

const ACCESS_SECRET = process.env.JWT_SECRET;
const ACCESS_EXPIRY = process.env.JWT_EXPIRES_IN  || '15m';
const REFRESH_EXPIRY = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
const REFRESH_MS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_MS) || 604800000;

const tokenService = {
  generateAccessToken(user) {
    return jwt.sign(
      {
        sub:   user.id,
        id: user.id,
        email: user.email,
        role:  user.role,
      },
      ACCESS_SECRET,
      { expiresIn: ACCESS_EXPIRY }
    );
  },

  generateRefreshToken(userId) {
    const rawToken = crypto.randomBytes(64).toString('hex');

    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const expiresAt = new Date(Date.now() + REFRESH_MS).toISOString();

    db.prepare(`
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
      VALUES (?, ?, ?)
    `).run(userId, tokenHash, expiresAt);

    return rawToken;
  },

  verifyRefreshToken(rawToken) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const record = db.prepare(`
      SELECT rt.*, u.id as uid, u.email, u.role, u.username
      FROM refresh_tokens rt
      JOIN users u ON u.id = rt.user_id
      WHERE rt.token_hash = ?
        AND rt.is_revoked = 0
        AND datetime(rt.expires_at) > datetime('now')
    `).get(tokenHash);

    return record || null;
  },

  revokeRefreshToken(rawToken) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    db.prepare(`
      UPDATE refresh_tokens SET is_revoked = 1 WHERE token_hash = ?
    `).run(tokenHash);
  },

  revokeAllUserTokens(userId) {
    db.prepare(`
      UPDATE refresh_tokens SET is_revoked = 1 WHERE user_id = ?
    `).run(userId);
  },
};

module.exports = tokenService;