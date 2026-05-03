// src/services/oauthService.js
const axios = require('axios');
const User = require('../models/User');
const OauthAccount = require('../models/OauthAccount');
const tokenService = require('./tokenService');

const oauthService = {
  async processGithubLogin(code) {
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
      const error = new Error('Gagal mendapatkan token dari GitHub.');
      error.statusCode = 400;
      throw error;
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

    let user = OauthAccount.findByProvider('github', githubUser.id);

    if (!user) {
      user = User.findByEmail(primaryEmail);

      if (!user) {
        const result = User.createWithoutPassword(githubUser.login, primaryEmail);
        user = User.findById(result.lastInsertRowid);
      }

      OauthAccount.upsert(user.id, 'github', githubUser.id, githubAccessToken);
    }

    const accessToken = tokenService.generateAccessToken(user);
    const refreshToken = tokenService.generateRefreshToken(user.id);

    return { accessToken, refreshToken };
  }
};

module.exports = oauthService;