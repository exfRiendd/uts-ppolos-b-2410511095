const { createProxyMiddleware } = require('http-proxy-middleware');
const services = require('../config/services');

const setupRoutes = (app) => {
    Object.entries(services).forEach(([name, service]) => {
        const proxyOptions = {
            target: service.url,
            changeOrigin: true,
            pathRewrite: (path, req) => {
                const newPath = path.startsWith('/api') ? path : `/api${path}`;
    
                console.log(`[Rewrite] Original: ${path} -> Final: ${newPath}`);
                return newPath;
            },
            on: {
                proxyReq: (proxyReq, req) => {
                    proxyReq.setHeader('x-user-id', '1'); 
                    proxyReq.setHeader('x-user-role', 'admin');
                    
                    console.log(`[Proxy] Sending to: ${service.url}${proxyReq.path}`);
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