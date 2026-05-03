const db = require('../config/database');

const User = {
  findByEmailOrUsername: (email, username) => {
    return db.prepare(
      'SELECT id FROM users WHERE email = ? OR username = ?'
    ).get(email, username);
  },

  findByEmail: (email) => {
    return db.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).get(email);
  },

  findById: (id) => {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },
  createWithoutPassword: (username, email) => {
    return db.prepare(
      'INSERT INTO users (username, email, role) VALUES (?, ?, ?)'
    ).run(username, email, 'user');
  },

  create: (username, email, password) => {
    return db.prepare(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)'
    ).run(username, email, password);
  }
};

module.exports = User;