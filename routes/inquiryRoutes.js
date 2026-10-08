import express from 'express';
import {
  createInquiry,
  getInquiries,
  getInquiryById,
  updateInquiryStatus,
  deleteInquiry,
} from '../controllers/inquiryController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(createInquiry)
  .get(protect, adminOnly, getInquiries);

router.route('/:id')
  .get(protect, adminOnly, getInquiryById)
  .put(protect, adminOnly, updateInquiryStatus)
  .delete(protect, adminOnly, deleteInquiry);

export default router;
