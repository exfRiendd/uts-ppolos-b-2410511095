const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Supplier = sequelize.define('Supplier', { 
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    contact_email: {
        type: DataTypes.STRING,
        validate: { isEmail: true },
    },
    phone: { type: DataTypes.STRING },
    address: { type: DataTypes.TEXT},
}, {
    tableName: 'suppliers',
});

module.exports = Supplier;
