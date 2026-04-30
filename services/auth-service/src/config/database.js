const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../../auth.db'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT    UNIQUE NOT NULL,
    email       TEXT    UNIQUE NOT NULL,
    password    TEXT,
    role        TEXT    DEFAULT 'user',
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    token_hash  TEXT    UNIQUE NOT NULL,
    expires_at  TEXT    NOT NULL,
    is_revoked  INTEGER DEFAULT 0,
    created_at  TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS oauth_accounts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    provider    TEXT    NOT NULL,
    provider_id TEXT    NOT NULL,
    access_token TEXT,
    created_at  TEXT    DEFAULT (datetime('now')),
    UNIQUE(provider, provider_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

console.log('[Auth DB] SQLite terhubung dan tabel siap');
module.exports = db;