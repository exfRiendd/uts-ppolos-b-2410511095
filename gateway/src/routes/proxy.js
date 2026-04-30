const { createProxyMiddleware } = require('http-proxy-middleware');
const services = require('../config/services');

const setupRoutes = (app) => {
    Object.entries(services).forEach(([name, service]) => {
        const proxyOptions = {
            target: service.url,
            changeOrigin: true,

            on: {
                error: (err, req, res) => {
                    console.error(`[Gateway] Proxy error ke ${name}: ${err.message}`);
                    res.status(502).json({
                        success: false,
                        message: `Service "${name}" tidak dapat dijangkau.`
                    });
                },
                proxyReq: (proxyReq, req) => {
                    console.log(`[Gateway] ${req.method} ${req.path} -> ${service.url}`);
                },
            },
        };

        app.use(service.prefix, createProxyMiddleware(proxyOptions));
        console.log(`[Gateway] Route terdaftar: ${service.prefix} -> ${service.url}`);
    });
};

module.exports = setupRoutes;