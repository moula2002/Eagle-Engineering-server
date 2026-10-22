import Product from '../models/Product.js';
import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';
import { uploadToCloud, deleteFromCloud } from '../utils/cloudStorage.js';

// Helper to safely parse JSON strings sent from FormData
function parseJsonField(field) {
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch {
      return field;
    }
  }
  return field;
}

// Helper to clean up payload fields for Mongoose
function sanitizeProductPayload(rawData) {
  const data = { ...rawData };

  // Category handling
  if (data.category && typeof data.category === 'object' && data.category._id) {
    data.category = data.category._id;
  }

  // SubCategory handling
  if (data.subCategory) {
    if (typeof data.subCategory === 'object' && data.subCategory._id) {
      data.subCategory = data.subCategory._id;
    } else if (data.subCategory === '' || data.subCategory === 'null' || data.subCategory === 'undefined') {
      data.subCategory = null;
    }
  } else {
    data.subCategory = null;
  }

  // SKU handling: omit or undefined if empty string so unique sparse index doesn't conflict
  if (typeof data.sku === 'string') {
    data.sku = data.sku.trim();
    if (!data.sku) {
      delete data.sku;
    }
  }

  // Parse nested JSON if sent as multipart form-data
  if (data.specifications) data.specifications = parseJsonField(data.specifications);
  if (data.seo) data.seo = parseJsonField(data.seo);
  if (data.features) data.features = parseJsonField(data.features);
  if (data.applications) data.applications = parseJsonField(data.applications);
  if (data.gallery) data.gallery = parseJsonField(data.gallery);

  // Booleans
  if (typeof data.isFeatured !== 'undefined') {
    data.isFeatured = data.isFeatured === true || data.isFeatured === 'true';
  }
  if (typeof data.isNewProduct !== 'undefined') {
    data.isNewProduct = data.isNewProduct === true || data.isNewProduct === 'true';
  }

  return data;
}

export const getProducts = async (req, res, next) => {
  try {
    const { category, subCategory, search, page, limit } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (subCategory) filter.subCategory = subCategory;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
      ];
    }

    let query = Product.find(filter)
      .select('-gallery -seo')
      .sort({ createdAt: -1 })
      .populate('category', 'name')
      .populate('subCategory', 'name')
      .lean();

    if (page && limit) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      query = query.skip((pageNum - 1) * limitNum).limit(limitNum);
      const [products, total] = await Promise.all([
        query.exec(),
        Product.countDocuments(filter),
      ]);
      return res.json({
        success: true,
        count: products.length,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        data: products,
      });
    }

    const products = await query.exec();
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .populate('subCategory', 'name')
      .lean();

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const payload = sanitizeProductPayload(req.body);

    // Validate required fields
    if (!payload.name || !payload.name.trim()) {
      return res.status(400).json({ success: false, message: 'Product name is required' });
    }
    if (!payload.category) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    // Handle multipart file uploads directly attached to request
    if (req.files) {
      const mainFile = (req.files.mainImage && req.files.mainImage[0]) || (req.files.mainImageFile && req.files.mainImageFile[0]);
      if (mainFile) {
        payload.mainImage = await uploadToCloud(mainFile);
      }

      const galleryFiles = req.files.gallery || req.files.galleryFiles || [];
      if (galleryFiles.length > 0) {
        const uploadedGallery = await Promise.all(galleryFiles.map((file) => uploadToCloud(file)));
        payload.gallery = [...(Array.isArray(payload.gallery) ? payload.gallery : []), ...uploadedGallery];
      }
    }

    const product = await Product.create(payload);
    const populated = await Product.findById(product._id)
      .populate('category', 'name')
      .populate('subCategory', 'name')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const existing = await Product.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const payload = sanitizeProductPayload(req.body);
    const oldMainImage = existing.mainImage;
    const oldGallery = Array.isArray(existing.gallery) ? [...existing.gallery] : [];

    // Handle multipart file uploads directly attached to update request
    if (req.files) {
      const mainFile = (req.files.mainImage && req.files.mainImage[0]) || (req.files.mainImageFile && req.files.mainImageFile[0]);
      if (mainFile) {
        payload.mainImage = await uploadToCloud(mainFile);
      }

      const galleryFiles = req.files.gallery || req.files.galleryFiles || [];
      if (galleryFiles.length > 0) {
        const uploadedGallery = await Promise.all(galleryFiles.map((file) => uploadToCloud(file)));
        payload.gallery = [...(Array.isArray(payload.gallery) ? payload.gallery : []), ...uploadedGallery];
      }
    }

    // If payload contains empty string for sku, ensure it is unset
    const updateQuery = { ...payload };
    const unsetQuery = {};
    if (!payload.sku && existing.sku && payload.sku !== undefined) {
      delete updateQuery.sku;
      unsetQuery.sku = 1;
    }

    const updateOps = { $set: updateQuery };
    if (Object.keys(unsetQuery).length > 0) {
      updateOps.$unset = unsetQuery;
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updateOps, {
      new: true,
      runValidators: true,
    })
      .populate('category', 'name')
      .populate('subCategory', 'name')
      .lean();

    // Send immediate successful response to client so UI responds in milliseconds
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updated,
    });

    // Non-blocking background image cleanup:
    // Remove replaced cloud images only AFTER DB update succeeded and only if not used by any other product
    (async () => {
      try {
        const currentImages = new Set([updated.mainImage, ...(updated.gallery || [])].filter(Boolean));
        const candidatesForRemoval = [oldMainImage, ...oldGallery].filter(
          (img) => img && typeof img === 'string' && img.startsWith('http') && !currentImages.has(img)
        );

        for (const removedImg of candidatesForRemoval) {
          const inUseCount = await Product.countDocuments({
            _id: { $ne: req.params.id },
            $or: [{ mainImage: removedImg }, { gallery: removedImg }],
          });

          if (inUseCount === 0) {
            await deleteFromCloud(removedImg);
          }
        }
      } catch (cleanupErr) {
        console.warn('Non-blocking image cleanup error:', cleanupErr.message);
      }
    })();
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const imagesToClean = [product.mainImage, ...(product.gallery || [])].filter(
      (img) => img && typeof img === 'string' && img.startsWith('http')
    );

    await product.deleteOne();

    res.json({
      success: true,
      message: 'Product deleted successfully',
      data: { id: req.params.id },
    });

    // Clean up cloud images not referenced by any other product in background
    (async () => {
      for (const img of imagesToClean) {
        try {
          const inUse = await Product.countDocuments({
            $or: [{ mainImage: img }, { gallery: img }],
          });
          if (inUse === 0) {
            await deleteFromCloud(img);
          }
        } catch (err) {
          console.warn('Non-blocking image cleanup error on delete:', err.message);
        }
      }
    })();
  } catch (error) {
    next(error);
  }
};

