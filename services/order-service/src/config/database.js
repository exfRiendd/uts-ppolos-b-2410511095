const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    'order_db',
    'root',
    '',
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false,
    }
);

module.exports = sequelize;