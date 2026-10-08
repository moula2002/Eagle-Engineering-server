import express from 'express';
import { getSubCategories, createSubCategory, deleteSubCategory } from '../controllers/subCategoryController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getSubCategories).post(protect, adminOnly, createSubCategory);
router.route('/:id').delete(protect, adminOnly, deleteSubCategory);

export default router;
