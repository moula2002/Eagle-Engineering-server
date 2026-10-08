import express from 'express';
import { upload } from '../middleware/uploadMiddleware.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Upload single file/image as raw base64 string
// @route   POST /api/upload
// @access  Private/Admin
router.post('/', protect, adminOnly, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  // Convert buffer to raw base64 string
  const base64Image = req.file.buffer.toString('base64');
  const dataURI = `data:${req.file.mimetype};base64,${base64Image}`;

  res.status(200).json({
    success: true,
    message: 'File processed successfully',
    url: dataURI,
    filename: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });
});

// @desc    Upload multiple files/images as raw base64 strings
// @route   POST /api/upload/multiple
// @access  Private/Admin
router.post('/multiple', protect, adminOnly, upload.array('files', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded' });
  }

  const fileUrls = req.files.map((file) => {
    const base64Image = file.buffer.toString('base64');
    return `data:${file.mimetype};base64,${base64Image}`;
  });

  res.status(200).json({
    success: true,
    message: `${req.files.length} files processed successfully`,
    urls: fileUrls,
  });
});

export default router;
