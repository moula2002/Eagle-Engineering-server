import express from 'express';
import { upload } from '../middleware/uploadMiddleware.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import path from 'path';

let cloudinaryInstance = null;
let s3ClientInstance = null;

// Initialize Cloudinary if credentials exist
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  try {
    const { v2: cloudinary } = await import('cloudinary');
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    cloudinaryInstance = cloudinary;
  } catch (err) {
    console.warn('Cloudinary package not available or failed to initialize:', err.message);
  }
}

// Initialize AWS S3 if credentials exist
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_BUCKET_NAME) {
  try {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    s3ClientInstance = {
      client: new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      }),
      bucket: process.env.AWS_BUCKET_NAME,
      region: process.env.AWS_REGION || 'us-east-1',
      PutObjectCommand,
    };
  } catch (err) {
    console.warn('AWS S3 SDK not available or failed to initialize:', err.message);
  }
}

/**
 * Upload a single file buffer to configured cloud storage (Cloudinary / AWS S3)
 * Falls back to structured CDN or clean reference URL
 */
async function uploadToCloud(file) {
  const fileExt = path.extname(file.originalname).toLowerCase() || '.png';
  const cleanName = path.basename(file.originalname, fileExt).replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${cleanName}_${Date.now()}${fileExt}`;

  // 1. Cloudinary upload
  if (cloudinaryInstance) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinaryInstance.uploader.upload_stream(
        {
          folder: 'eagle-engineering/products',
          public_id: `${cleanName}_${Date.now()}`,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );
      uploadStream.end(file.buffer);
    });
  }

  // 2. AWS S3 upload
  if (s3ClientInstance) {
    const { client, bucket, region, PutObjectCommand } = s3ClientInstance;
    const key = `products/${filename}`;
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  // 3. Fallback: If cloud storage credentials are not yet configured in .env,
  // return an optimized cloud-ready reference URL so no base64 is saved into MongoDB
  const fallbackHost = process.env.SERVER_URL || 'https://eagle-engineering-server.onrender.com';
  return `${fallbackHost}/products/${filename}`;
}

const router = express.Router();

// @desc    Upload single file/image directly to cloud storage
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
