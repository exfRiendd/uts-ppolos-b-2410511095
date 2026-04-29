const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,

    handler: (req,res) => {
        res.status(429).json({
            success: false,
            message: 'Terlalu banyak request. Coba lagi dalam 1 menit.',
            retryAfter: Math.ceil(req.rateLimit.resetTime/1000),
        });
    },
});

module.exports = limiter;