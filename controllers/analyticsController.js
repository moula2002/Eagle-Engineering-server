import Product from '../models/Product.js';
import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';
import Inquiry from '../models/Inquiry.js';

// @desc    Get system analytics summary & metrics
// @route   GET /api/analytics/summary
// @access  Private/Admin
export const getAnalyticsSummary = async (req, res, next) => {
  try {
    const totalProducts = await Product.countDocuments();
    const inStockProducts = await Product.countDocuments({ status: 'Active' });
    
    const totalCategories = await Category.countDocuments();
    const totalSubCategories = await SubCategory.countDocuments();

    const totalInquiries = await Inquiry.countDocuments();
    const newInquiries = await Inquiry.countDocuments({ status: 'New' });
    const inReviewInquiries = await Inquiry.countDocuments({ status: 'In Review' });

    // Group products by category
    const productsByCategory = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);

    // Recent 5 inquiries
    const recentInquiries = await Inquiry.find().sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      data: {
        metrics: {
          totalProducts,
          inStockProducts,
          totalCategories,
          totalSubCategories,
          totalInquiries,
          newInquiries,
          inReviewInquiries,
        },
        productsByCategory,
        recentInquiries,
      },
    });
  } catch (error) {
    next(error);
  }
};
