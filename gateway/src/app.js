require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const rateLimiter = require('./middlewares/rateLimiter');
const jwtValidator = require('./middlewares/jwtValidator');
const setupRoutes = require('./routes/proxy');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet()); 
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(rateLimiter); 
setupRoutes(app);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'api-gateway', timestamp: new Date() });
});
app.use(jwtValidator);

app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: `Route ${req.path} tidak ditemukan di gateway.` 
    });
});

app.listen(PORT, () => {
    console.log(`[Gateway] Berjalan di http://localhost:${PORT}`);
});

module.exports = app;