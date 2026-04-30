require('dotenv').config();
const express = require('express');
require('./config/database');

const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', authRoutes);

app.get('/health', (_, res) =>
res.json({ status: 'ok', service: 'auth-service'})
);

app.listen(PORT, () =>
console.log(`[Auth Service] Berjalan di http://localhost:${PORT}`)
);