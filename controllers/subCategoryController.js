import SubCategory from '../models/SubCategory.js';

export const getSubCategories = async (req, res, next) => {
  try {
    const subCategories = await SubCategory.find({}).populate('category', 'name');
    res.json({ success: true, count: subCategories.length, data: subCategories });
  } catch (error) {
    next(error);
  }
};

export const createSubCategory = async (req, res, next) => {
  try {
    const subCategory = await SubCategory.create(req.body);
    res.status(201).json({ success: true, data: subCategory });
  } catch (error) {
    next(error);
  }
};

export const updateSubCategory = async (req, res, next) => {
  try {
    let subCategory = await SubCategory.findById(req.params.id);
    if (!subCategory) {
      return res.status(404).json({ success: false, message: 'SubCategory not found' });
    }
    subCategory = await SubCategory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.json({ success: true, data: subCategory });
  } catch (error) {
    next(error);
  }
};

export const deleteSubCategory = async (req, res, next) => {
  try {
    const subCategory = await SubCategory.findById(req.params.id);
    if (!subCategory) {
      return res.status(404).json({ success: false, message: 'SubCategory not found' });
    }
    await subCategory.deleteOne();
    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
