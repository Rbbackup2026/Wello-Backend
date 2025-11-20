const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Certificate name is required'],
    trim: true,
    maxlength: [100, 'Certificate name cannot exceed 100 characters']
  },
  imageUrl: {
    type: String,
    default: null
  },

  sortOrder: {
    type: Number,
    required: [true, 'Sort order is required'],
    min: [1, 'Sort order must be at least 1'],
    default: 1
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  
}, {
  timestamps: true
});

// Index for sorting and filtering
certificateSchema.index({ sortOrder: 1, status: 1 });
certificateSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Certificate', certificateSchema);