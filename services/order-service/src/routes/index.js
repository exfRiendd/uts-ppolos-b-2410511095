const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const orderController = require('../controllers/orderController');

router.get('/', supplierController.index);
router.post('/', supplierController.store);
router.get('/:id', supplierController.show);
router.put('/:id', supplierController.update);
router.delete('/:id', supplierController.destroy);

const orderRouter = express.Router();
orderRouter.get('/', orderController.index);
orderRouter.post('/', orderController.store);
orderRouter.get('/:id', orderController.show);
orderRouter.patch('/:id/cancel', orderController.cancel);

module.exports = { supplierRouter: router, orderRouter };