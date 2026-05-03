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
  console.log('--- AUDIT KUNCI GATEWAY ---');
    console.log('Token yang diterima:', token ? token.substring(0, 15) + "..." : "KOSONG");
    console.log('Secret di ENV:', process.env.JWT_SECRET);
    console.log('Secret Hardcoded:', 'feace4a8ff0348b72013ce0a259223ee0d949411d3376bf17ce89b3ea6a5176d');
    console.log('SAMA NGGAK?:', process.env.JWT_SECRET === 'feace4a8ff0348b72013ce0a259223ee0d949411d3376bf17ce89b3ea6a5176d');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token tidak ditemukan. Sertakan Authorization: Bearer <token>',
    });
  }

  try {
  const secretHardcode = 'feace4a8ff0348b72013ce0a259223ee0d949411d3376bf17ce89b3ea6a5176d';
  
  const decoded = jwt.verify(token, secretHardcode);

  const userId = decoded.id || decoded.sub;
  if (!userId) throw new Error('User ID tidak ditemukan');

  req.headers['x-user-id']   = String(userId);
  req.headers['x-user-role'] = decoded.role || 'user';
  
  next();
} catch (err) {
  console.log('--- ERROR VERIFIKASI GATEWAY ---');
  console.log('Pesan:', err.message);
  return res.status(401).json({ success: false, message: 'Gagal: ' + err.message });
}
};

module.exports = jwtValidator;