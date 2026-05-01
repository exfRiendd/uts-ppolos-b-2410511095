const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Supplier = require('./Supplier');

const Order = sequelize.define('Order', { 
    supplier_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'cancelled'),
        defaultValue: 'pending',
    },
    total_amount: {
        type: DataTypes.DECIMAL(14, 2),
        defaultValue: 0,
    },
    note: { type: DataTypes.TEXT },
    created_by: { type: DataTypes.STRING },
}, {
    tableName: 'orders',
} );

Order.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
Supplier.hasMany(Order, { foreignKey: 'supplier_id', as: 'orders' });

module.exports = Order;
