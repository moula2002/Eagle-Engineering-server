import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
    },
    clientTitle: {
      type: String,
      default: 'Managing Director',
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    content: {
      type: String,
      required: [true, 'Testimonial text is required'],
    },
    avatar: {
      type: String,
      default: '',
    },
    projectRef: {
      type: String,
      default: '',
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Testimonial = mongoose.model('Testimonial', testimonialSchema);
export default Testimonial;
