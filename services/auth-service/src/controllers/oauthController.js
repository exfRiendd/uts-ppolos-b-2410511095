// src/controllers/oauthController.js
const axios        = require('axios');
const crypto       = require('crypto');
const db           = require('../config/database');
const tokenService = require('../services/tokenService');

const stateStore = new Map();

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const oauthController = {
  githubRedirect(req, res) {
    const state = crypto.randomBytes(16).toString('hex');
    stateStore.set(state, Date.now() + 10 * 60 * 1000);

    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID,
      redirect_uri: process.env.GITHUB_CALLBACK_URL,
      scope: 'user:email',
      state,
    });

    res.redirect(`https://github.com/login/oauth/authorize?${params}`);
  },

  async githubCallback(req, res) {
    const { code, state } = req.query;

    const expiry = stateStore.get(state);
    if (!expiry || Date.now() > expiry) {
      stateStore.delete(state);
      return res.status(400).json({
        success: false,
        message: 'State tidak valid atau expired. Ulangi login.',
      });
    }
    stateStore.delete(state);

    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_CALLBACK_URL,
      },
      { headers: { Accept: 'application/json' } }
    );

    const githubAccessToken = tokenRes.data.access_token;
    if (!githubAccessToken) {
      return res.status(400).json({
        success: false,
        message: 'Gagal mendapatkan token dari GitHub.',
      });
    }

    const [userRes, emailRes] = await Promise.all([
      axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${githubAccessToken}` },
      }),
      axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${githubAccessToken}` },
      }),
    ]);

    const githubUser = userRes.data;
    const primaryEmail = emailRes.data.find(e => e.primary)?.email || githubUser.email;

    let user = db.prepare(
      'SELECT u.* FROM users u JOIN oauth_accounts oa ON oa.user_id = u.id WHERE oa.provider = ? AND oa.provider_id = ?'
    ).get('github', String(githubUser.id));

    if (!user) {
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(primaryEmail);

      if (!user) {
        const result = db.prepare(
          'INSERT INTO users (username, email, role) VALUES (?, ?, ?)'
        ).run(githubUser.login, primaryEmail, 'user');
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
      }

      db.prepare(
        'INSERT OR REPLACE INTO oauth_accounts (user_id, provider, provider_id, access_token) VALUES (?, ?, ?, ?)'
      ).run(user.id, 'github', String(githubUser.id), githubAccessToken);
    }

    const accessToken = tokenService.generateAccessToken(user);
    const refreshToken = tokenService.generateRefreshToken(user.id);

    res.cookie('refreshToken', refreshToken, COOKIE_OPTS);

    res.redirect(`http://localhost:5173/auth-callback?token=${accessToken}`);
  },
};

module.exports = oauthController;