const crypto = require('crypto');
const oauthService = require('../services/oauthService');

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
    try {
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

      const result = await oauthService.processGithubLogin(code);

      res.cookie('refreshToken', result.refreshToken, COOKIE_OPTS);
      res.redirect(`http://localhost:5173/auth-callback?token=${result.accessToken}`);
      
    } catch (error) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, message: error.message });
    }
  },
};

module.exports = oauthController;