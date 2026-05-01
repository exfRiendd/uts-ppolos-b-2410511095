const Supplier = require('../models/Supplier');

const supplierController = { 
    async index(req,res) {
        const suppliers = await Supplier.findAll({ order: [['createdAt', 'DESC']]});
        res.json({ success: true, data: suppliers});
    },

    async store(req,res) {
        const { name, contact_email, phone, address } = req.body;
        if(!name) {
            return res.status(422).json({ success: false, message: 'Nama supplier wajib diisi.'});
        }
        const supplier = await Supplier.create({ name, contact_email, phone, address });
        res.status(201).json({ success: true, data: supplier });
    },

    async show(req, res) {
        const supplier = await Supplier.findByPk(req.params.id, {
        include: [{ association: 'orders', limit: 10, order: [['createdAt', 'DESC']] }],
        });
        if (!supplier) return res.status(404).json({ success: false, message: 'Supplier tidak ditemukan.' });
        res.json({ success: true, data: supplier });
    },
    async update(req, res) {
        const supplier = await Supplier.findByPk(req.params.id);
        if (!supplier) return res.status(404).json({ success: false, message: 'Supplier tidak ditemukan.' });
        await supplier.update(req.body);
        res.json({ success: true, data: supplier });
    },

    async destroy(req, res) {
        const supplier = await Supplier.findByPk(req.params.id);
        if (!supplier) return res.status(404).json({ success: false, message: 'Supplier tidak ditemukan.' });
        await supplier.destroy();
        res.json({ success: true, message: 'Supplier dihapus.' });
    },
};

module.exports = supplierController;