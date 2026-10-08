import express from 'express';
import {
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from '../controllers/testimonialController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getTestimonials)
  .post(createTestimonial);

router.route('/:id')
  .put(protect, adminOnly, updateTestimonial)
  .delete(protect, adminOnly, deleteTestimonial);

export default router;
