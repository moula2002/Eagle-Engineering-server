import express from 'express';
import { getAnalyticsSummary } from '../controllers/analyticsController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/summary', protect, adminOnly, getAnalyticsSummary);

export default router;
