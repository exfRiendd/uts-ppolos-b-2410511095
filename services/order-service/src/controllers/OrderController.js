const Order           = require('../models/Order');
const Supplier        = require('../models/Supplier');
const inventoryClient = require('../services/inventoryClient');

const orderController = {

    async index(req, res) {
        const orders = await Order.findAll({
            include: [{ model: Supplier, as: 'supplier' }],
            order:   [['createdAt', 'DESC']],
        });
        res.json({ success: true, data: orders });
    },

    async store(req, res) {
        const { supplier_id, items, note } = req.body;
        const userId = req.headers['x-user-id'];
        
        const token = req.headers.authorization;
        console.log("[DEBUG TOKEN] Isi token adalah:", token);
        if (!supplier_id || !Array.isArray(items) || items.length === 0) {
            return res.status(422).json({
                success: false,
                message: 'supplier_id dan items[] wajib diisi.',
            });
        }

        const supplier = await Supplier.findByPk(supplier_id);
        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Supplier tidak ditemukan.' });
        }

        let productDetails;
        try {
            productDetails = await Promise.all(
                items.map(item => inventoryClient.getProduct(item.product_id, token))
            );
        } catch (err) {
            return res.status(502).json({
                success: false,
                message: 'Gagal mengambil data produk dari Inventory Service.',
                detail:  err.response?.data?.message || err.message,
            });
        }

        const total = items.reduce((sum, item, i) => {
            return sum + (item.quantity * parseFloat(productDetails[i].price));
        }, 0);

        const order = await Order.create({
            supplier_id,
            status:       'pending',
            total_amount: total,
            note,
            created_by:   userId,
        });

        try {
            await inventoryClient.reserveStock(order.id, items, userId, token);
        } catch (err) {
            await order.update({ status: 'cancelled' });

            const msg = err.response?.data?.message || 'Stok tidak mencukupi.';
            return res.status(422).json({
                success: false,
                message: `Order dibatalkan: ${msg}`,
                order_id: order.id,
            });
        }

        await order.update({ status: 'confirmed' });

        res.status(201).json({
            success: true,
            message: 'Order berhasil dibuat.',
            data: {
                ...order.toJSON(),
                items: items.map((item, i) => ({
                    product_id:   item.product_id,
                    product_name: productDetails[i].name,
                    quantity:     item.quantity,
                    unit_price:   productDetails[i].price,
                })),
            },
        });
    },

    async show(req, res) {
        const order = await Order.findByPk(req.params.id, {
            include: [{ model: Supplier, as: 'supplier' }],
        });
        if (!order) return res.status(404).json({ success: false, message: 'Order tidak ditemukan.' });
        res.json({ success: true, data: order });
    },

    async cancel(req, res) {
        const order = await Order.findByPk(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order tidak ditemukan.' });
        if (order.status !== 'pending') {
            return res.status(422).json({ success: false, message: 'Hanya order pending yang bisa dibatalkan.' });
        }
        await order.update({ status: 'cancelled' });
        res.json({ success: true, message: 'Order dibatalkan.' });
    },
};

module.exports = orderController;