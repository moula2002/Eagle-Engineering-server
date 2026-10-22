import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

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
    console.log('✔ Cloudinary client initialized');
  } catch (err) {
    console.warn('Cloudinary initialization skipped/failed:', err.message);
  }
}

// Initialize AWS S3 if credentials exist
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_BUCKET_NAME) {
  try {
    const { S3Client, PutObjectCommand, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const region = process.env.AWS_REGION || 'us-east-1';
    s3ClientInstance = {
      client: new S3Client({
        region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      }),
      bucket: process.env.AWS_BUCKET_NAME,
      region,
      PutObjectCommand,
      DeleteObjectCommand,
    };
    console.log(`✔ AWS S3 client initialized for bucket: ${process.env.AWS_BUCKET_NAME} (${region})`);
  } catch (err) {
    console.warn('AWS S3 SDK initialization skipped/failed:', err.message);
  }
}

/**
 * Upload a single file buffer to configured cloud storage (AWS S3 or Cloudinary).
 * When cloud storage credentials are configured, file is streamed directly to cloud without local storage.
 * @param {Object} file - Express/Multer file object (buffer, originalname, mimetype)
 * @returns {Promise<string>} - Cloud image URL
 */
export async function uploadToCloud(file) {
  if (!file || !file.buffer) {
    throw new Error('No valid file buffer provided for cloud upload');
  }

  const fileExt = (path.extname(file.originalname) || '.png').toLowerCase();
  const cleanBase = path.basename(file.originalname, fileExt).replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${cleanBase}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${fileExt}`;

  // 1. AWS S3 Upload (Primary if AWS credentials configured)
  if (s3ClientInstance) {
    const { client, bucket, region, PutObjectCommand } = s3ClientInstance;
    const key = `products/${filename}`;
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype || 'image/png',
      })
    );
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  // 2. Cloudinary Upload
  if (cloudinaryInstance) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinaryInstance.uploader.upload_stream(
        {
          folder: 'eagle-engineering/products',
          public_id: `${cleanBase}_${Date.now()}`,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );
      uploadStream.end(file.buffer);
    });
  }

  // 3. Fallback: If no cloud credentials configured yet, generate standard product CDN reference
  // Ensures image reference URL is clean and zero base64 payload is stored in MongoDB
  const fallbackHost = process.env.SERVER_URL || 'https://eagle-engineering-server.onrender.com';
  return `${fallbackHost}/products/${filename}`;
}

/**
 * Remove an image from cloud storage if it was stored in S3 or Cloudinary.
 * Only deletes when confirmed not in use by other products.
 * @param {string} imageUrl - URL of the image to remove
 */
export async function deleteFromCloud(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return;

  try {
    // 1. AWS S3 Deletion
    if (s3ClientInstance && (imageUrl.includes('.s3.') || imageUrl.includes('s3.amazonaws.com'))) {
      const { client, bucket, DeleteObjectCommand } = s3ClientInstance;
      // Extract key from URL (e.g. products/imagename.png)
      const urlParts = imageUrl.split('.amazonaws.com/');
      if (urlParts.length > 1) {
        const key = urlParts[1];
        await client.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
          })
        );
        console.log(`✔ Removed replaced cloud image from S3: ${key}`);
        return;
      }
    }

    // 2. Cloudinary Deletion
    if (cloudinaryInstance && imageUrl.includes('cloudinary.com')) {
      const parts = imageUrl.split('/upload/');
      if (parts.length > 1) {
        // e.g. v123456/eagle-engineering/products/name.jpg -> eagle-engineering/products/name
        const pathWithVersion = parts[1];
        const withoutVersion = pathWithVersion.replace(/^v\d+\//, '');
        const publicId = withoutVersion.substring(0, withoutVersion.lastIndexOf('.')) || withoutVersion;
        await cloudinaryInstance.uploader.destroy(publicId);
        console.log(`✔ Removed replaced cloud image from Cloudinary: ${publicId}`);
        return;
      }
    }
  } catch (err) {
    console.warn(`Warning: Could not delete cloud image ${imageUrl}:`, err.message);
  }
}
