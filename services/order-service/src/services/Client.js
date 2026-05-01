const axios = require('axios');

const BASE = process.env.INVENTORY_SERVICE_URL || 'http://localhost:8000';

const internalHeaders = {
    'x-user-id': '0',
    'x-user-role': 'service',
    'x-service': 'order-service',
};

const inventoryClient = axios.create({
    async getProducts(productId){
        const res = await axios.get(
            `${BASE}/api/inventory/products/${productId}`,
            { headers: internalHeaders }
        );
        return res.data.data;
    },
    async reserveStock(orderId, items, userId) {
        const res = await axios.post(
            `${BASE}/api/inventory/reserve`,
            { order_id: orderId, items },
            { headers: { ...internalHeaders, 'x-user-id': String(userId) } }
        );
        return res.data;
    },
});

module.exports = inventoryClient;