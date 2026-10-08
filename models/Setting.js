import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      default: 'Eagle Engineering & Contracting',
    },
    tagline: {
      type: String,
      default: 'Pioneering Structural & Heavy Industrial Engineering Solutions',
    },
    email: {
      type: String,
      default: 'contact@eagleengineering.com',
    },
    phone: {
      type: String,
      default: '+1 (800) 555-EAGLE',
    },
    alternatePhone: {
      type: String,
      default: '+1 (800) 555-0199',
    },
    address: {
      type: String,
      default: '100 Engineering Parkway, Suite 500, Industrial District, TX 75001',
    },
    workingHours: {
      type: String,
      default: 'Mon - Fri: 8:00 AM - 6:00 PM CST',
    },
    socialLinks: {
      linkedin: { type: String, default: 'https://linkedin.com' },
      twitter: { type: String, default: 'https://twitter.com' },
      facebook: { type: String, default: 'https://facebook.com' },
      instagram: { type: String, default: 'https://instagram.com' },
    },
    stats: {
      yearsExperience: { type: Number, default: 25 },
      completedProjects: { type: Number, default: 450 },
      expertEngineers: { type: Number, default: 85 },
      clientSatisfaction: { type: Number, default: 99 },
    },
  },
  {
    timestamps: true,
  }
);

const Setting = mongoose.model('Setting', settingSchema);
export default Setting;
