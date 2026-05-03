const { createProxyMiddleware } = require('http-proxy-middleware');
const jwtValidator = require('../middlewares/jwtValidator');
const services = require('../config/services');

const setupRoutes = (app) => {
  Object.entries(services).forEach(([name, service]) => {
    const middlewares = service.public ? [] : [jwtValidator];

    const proxyOptions = {
      target: service.url,
      changeOrigin: true,
      pathRewrite: (path, req) => {
        if (req.originalUrl.startsWith('/api/inventory')) {
            const finalPath = '/api' + path;
            return finalPath;
        }
        return req.originalUrl;
      },
      on: {
        error: (err, req, res) => {
          console.error(`[Gateway] Proxy error ke ${name}:`, err.message);
          res.status(502).json({ success: false, message: err.message });
        },
        proxyReq: (proxyReq, req) => {
          console.log(`[TARGET AKHIR] ${req.method} -> ${service.url}${proxyReq.path}`);
        }
      }
    };

    app.use(service.prefix, ...middlewares, createProxyMiddleware(proxyOptions));
    console.log(`[Gateway] Terdaftar: ${service.prefix} -> ${service.url}`);
  });
};

module.exports = setupRoutes;