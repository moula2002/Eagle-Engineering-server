import express from 'express';
import { upload } from '../middleware/uploadMiddleware.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { uploadToCloud } from '../utils/cloudStorage.js';

const router = express.Router();

// @desc    Upload single file/image directly to cloud storage (AWS S3 / Cloudinary)
// @route   POST /api/upload
// @access  Private/Admin
router.post('/', protect, adminOnly, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileUrl = await uploadToCloud(req.file);

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully to cloud storage',
      url: fileUrl,
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });
  } catch (err) {
    console.error('Cloud upload failed:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Cloud image upload failed',
    });
  }
});

// @desc    Upload multiple files/images to cloud storage
// @route   POST /api/upload/multiple
// @access  Private/Admin
router.post('/multiple', protect, adminOnly, upload.array('files', 10), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const fileUrls = await Promise.all(req.files.map((file) => uploadToCloud(file)));

    res.status(200).json({
      success: true,
      message: `${req.files.length} images uploaded successfully to cloud storage`,
      urls: fileUrls,
    });
  } catch (err) {
    console.error('Multiple cloud upload failed:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Cloud images upload failed',
    });
  }
});

export default router;
