import express from 'express';
import { getProducts, createProduct, deleteProduct } from '../controllers/productController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getProducts).post(protect, adminOnly, createProduct);
router.route('/:id').delete(protect, adminOnly, deleteProduct);

export default router;
