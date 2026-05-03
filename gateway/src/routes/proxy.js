const { createProxyMiddleware } = require('http-proxy-middleware');
const services = require('../config/services');

const setupRoutes = (app) => {
    Object.entries(services).forEach(([name, service]) => {
        const proxyOptions = {
            target: service.url,
            changeOrigin: true,
            pathRewrite: (path, req) => {
                // Jika service adalah inventory (Laravel)
                if (name === 'inventory') {
                    // Mengubah /products/1 menjadi /api/products/1
                    return `/api${path}`;
                }
                
                // Untuk service Node.js (Orders, Suppliers, Auth)
                // Kita harus mengembalikan prefix aslinya (misal /api/orders) 
                // agar cocok dengan app.use di service tujuan
                const restoredPath = `${service.prefix}${path}`.replace(/\/+$/, "");
                return restoredPath || '/';
            },
            on: {
                proxyReq: (proxyReq, req) => {
                    const authHeader = req.headers['authorization'];
                    if (authHeader) {
                        proxyReq.setHeader('Authorization', authHeader);
                    }
                    
                    proxyReq.setHeader('x-user-id', '1'); 
                    proxyReq.setHeader('x-user-role', 'admin');
                    
                    console.log(`[Proxy] Forwarding ${req.method} to: ${service.url}${proxyReq.path}`);
                },
                error: (err, req, res) => {
                    console.error(`[Error] ${name}: ${err.message}`);
                    res.status(502).json({ success: false, message: `Service ${name} mati.` });
                }
            }
        };

        app.use(service.prefix, createProxyMiddleware(proxyOptions));
        console.log(`[Gateway] Monitoring: ${service.prefix} -> ${service.url}`);
    });
};

module.exports = setupRoutes;