import express from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/productController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

const productUpload = upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'gallery', maxCount: 10 },
  { name: 'mainImageFile', maxCount: 1 },
  { name: 'galleryFiles', maxCount: 10 },
]);

router.route('/')
  .get(getProducts)
  .post(protect, adminOnly, productUpload, createProduct);

router.route('/:id')
  .get(getProductById)
  .put(protect, adminOnly, productUpload, updateProduct)
  .delete(protect, adminOnly, deleteProduct);

export default router;
