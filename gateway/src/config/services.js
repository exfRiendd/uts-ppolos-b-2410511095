const services = {
    auth: {
        url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
        prefix: '/api/auth',
        public: true,
    },
    inventory: {
        url: process.env.INVENTORY_SERVICE_URL || 'http://localhost:8000',
        prefix: '/api/inventory',
        public: false,
    },
    orders: {
        url: process.env.ORDER_SERVICE_URL || 'http://localhost:3002',
        prefix: '/api/orders',
        public: false,
    },
};

module.exports = services;