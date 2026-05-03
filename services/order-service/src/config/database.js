const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    'order_db',
    'root',
    '',
    {
        host: process.env.DB_HOST || '127.0.0.1',
        dialect: 'mysql',
        logging: false,
    }
);

module.exports = sequelize;