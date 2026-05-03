const jwt = require('jsonwebtoken');
const services = require('../config/services');

const PUBLIC_PREFIXES = Object.values(services)
    .filter(s => s.public)
    .map(s => s.prefix);

const jwtValidator = (req, res, next) => {
    const isPublic = PUBLIC_PREFIXES.some(prefix => 
        req.path.startsWith(prefix)
    ) || req.path === '/health'; 

    if (isPublic) return next();

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token tidak ditemukan. Sertakan Authorization: Bearer <token>',
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.headers['x-user-id'] = String(decoded.sub);
        req.headers['x-user-role'] = decoded.role || 'user';
        req.headers['x-user-email'] = decoded.email || '';

        delete req.headers['authorization'];

        next();
    } catch (err) {
        const message = err.name === 'TokenExpiredError'
            ? 'Token sudah kadaluarsa. Gunakan refresh token.'
            : 'Token tidak valid.';

        return res.status(401).json({ success: false, message });
    }
};

module.exports = jwtValidator;