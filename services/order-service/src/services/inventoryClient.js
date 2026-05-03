const axios = require('axios');

const BASE = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3000';

const inventoryClient = {
    async getProduct(productId, token) {
        const res = await axios.get(
            `${BASE}/api/inventory/products/${productId}`,
            { 
                headers: {
                    'Authorization': token,
                    'x-user-role': 'service',
                    'x-service': 'order-service'
                } 
            }
        );
        return res.data.data;
    },

    async reserveStock(orderId, items, userId, token) {
        const res = await axios.post(
            `${BASE}/api/inventory/stock/reserve`, 
            { order_id: orderId, items },
            { 
                headers: { 
                    'Authorization': token,
                    'x-user-id': String(userId),
                    'x-user-role': 'service',
                    'x-service': 'order-service' 
                } 
            }
        );
        return res.data;
    },
};

module.exports = inventoryClient;