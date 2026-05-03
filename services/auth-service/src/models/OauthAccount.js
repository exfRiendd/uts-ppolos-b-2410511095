// src/models/OauthAccount.js
const db = require('../config/database');

const OauthAccount = {
  findByProvider: (provider, providerId) => {
    return db.prepare(
      `SELECT u.* FROM users u 
       JOIN oauth_accounts oa ON oa.user_id = u.id 
       WHERE oa.provider = ? AND oa.provider_id = ?`
    ).get(provider, String(providerId));
  },

  upsert: (userId, provider, providerId, accessToken) => {
    return db.prepare(
      `INSERT OR REPLACE INTO oauth_accounts 
       (user_id, provider, provider_id, access_token) 
       VALUES (?, ?, ?, ?)`
    ).run(userId, provider, String(providerId), accessToken);
  }
};

module.exports = OauthAccount;