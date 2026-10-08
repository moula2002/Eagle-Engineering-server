import Testimonial from '../models/Testimonial.js';

// @desc    Get all testimonials
// @route   GET /api/testimonials
// @access  Public
export const getTestimonials = async (req, res, next) => {
  try {
    const { approvedOnly } = req.query;
    const query = {};

    if (approvedOnly !== 'false') {
      query.isApproved = true;
    }

    const testimonials = await Testimonial.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: testimonials.length,
      data: testimonials,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create testimonial
// @route   POST /api/testimonials
// @access  Public / Private Admin
export const createTestimonial = async (req, res, next) => {
  try {
    const { clientName, clientTitle, company, rating, content, avatar, projectRef, isApproved } = req.body;

    const testimonial = await Testimonial.create({
      clientName,
      clientTitle: clientTitle || 'Managing Director',
      company,
      rating: rating || 5,
      content,
      avatar: avatar || '',
      projectRef: projectRef || '',
      isApproved: isApproved !== undefined ? isApproved : true,
    });

    res.status(201).json({
      success: true,
      data: testimonial,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update testimonial (Approval / Content)
// @route   PUT /api/testimonials/:id
// @access  Private/Admin
export const updateTestimonial = async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }

    const updatedTestimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      data: updatedTestimonial,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete testimonial
// @route   DELETE /api/testimonials/:id
// @access  Private/Admin
export const deleteTestimonial = async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }

    await testimonial.deleteOne();

    res.json({
      success: true,
      message: 'Testimonial deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
