require('dotenv').config();
const express = require('express');
const sequelize = require('./src/config/database');

require('./src/models/Supplier');
require('./src/models/Order');

const { supplierRouter, orderRouter } = require('./src/routes/index');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

app.use('./api/orders/suppliers', supplierRouter);
app.use('/api/orders', orderRouter);

app.get('/health', (_, res) =>
  res.json({ status: 'ok', service: 'order-service' })
);

sequelize.sync({ alter: true })
.then(() => {
    console.log('[Order DB] Tabel tersinkronisasi');
    app.listen(PORT, () => 
    console.log(`[Order Service] Berjalan di http://localhost:${PORT}`)
);
})
.catch(err => {
    console.error('[Order DB] Gagal koneksi:', err.message);
    process.exit(1);
})