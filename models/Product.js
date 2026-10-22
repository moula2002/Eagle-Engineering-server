import mongoose from 'mongoose';
import './Category.js';
import './SubCategory.js';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubCategory',
      index: true,
    },
    brand: {
      type: String,
      default: '',
      trim: true,
    },
    shortDescription: {
      type: String,
      default: '',
    },
    fullDescription: {
      type: String,
      default: '',
    },
    mainImage: {
      type: String,
      default: '',
    },
    gallery: [
      {
        type: String,
      },
    ],
    specifications: {
      size: { type: String, default: '' },
      length: { type: String, default: '' },
      diameter: { type: String, default: '' },
      material: { type: String, default: '' },
      finish: { type: String, default: '' },
      color: { type: String, default: '' },
      weight: { type: String, default: '' },
    },
    features: [
      {
        type: String,
      },
    ],
    applications: [
      {
        type: String,
      },
    ],
    seo: {
      metaTitle: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
      metaKeywords: { type: String, default: '' },
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isNewProduct: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Optimize query performance with compound indexes
productSchema.index({ createdAt: -1 });
productSchema.index({ name: 'text', sku: 'text', brand: 'text' });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export default Product;
