import Product from '../models/Product.js';

export const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({})
      .populate('category', 'name')
      .populate('subCategory', 'name');
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
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
    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
