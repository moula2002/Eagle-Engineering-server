import express from 'express';
import { upload } from '../middleware/uploadMiddleware.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Upload single file/image
// @route   POST /api/upload
// @access  Private/Admin
router.post('/', protect, adminOnly, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const filePath = `/${req.file.path.replace(/\\/g, '/')}`;

  res.status(200).json({
    success: true,
    message: 'File uploaded successfully',
    url: filePath,
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });
});

// @desc    Upload multiple files/images
// @route   POST /api/upload/multiple
// @access  Private/Admin
router.post('/multiple', protect, adminOnly, upload.array('files', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded' });
  }

  const fileUrls = req.files.map((file) => `/${file.path.replace(/\\/g, '/')}`);

  res.status(200).json({
    success: true,
    message: `${req.files.length} files uploaded successfully`,
    urls: fileUrls,
  });
});

export default router;
