import Product from '../models/Product.js';

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
      .sort({ createdAt: -1 })
      .select('-gallery')
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
    // Validate required fields
    if (!req.body.name || !req.body.name.trim()) {
      return res.status(400).json({ success: false, message: 'Product name is required' });
    }
    if (!req.body.category) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    const product = await Product.create(req.body);
    const populated = await Product.findById(product._id)
      .populate('category', 'name')
      .populate('subCategory', 'name')
      .lean();
    res.status(201).json({ success: true, data: populated });
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

    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('category', 'name')
      .populate('subCategory', 'name')
      .lean();

    res.json({ success: true, data: updated });
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
    await product.deleteOne();
    res.json({ success: true, message: 'Product deleted successfully', data: { id: req.params.id } });
  } catch (error) {
    next(error);
  }
};
