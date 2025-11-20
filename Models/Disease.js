const mongoose = require('mongoose');

const diseaseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Disease name is required'],
    trim: true,
    maxlength: [100, 'Disease name cannot exceed 100 characters']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true,
    maxlength: [50, 'Department name cannot exceed 50 characters']
  },
  sortOrder: {
    type: Number,
    required: [true, 'Sort order is required'],
    min: [1, 'Sort order must be at least 1']
  },
  showHome: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  iconimg: {
    type: String,
    default: null
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for unique constraint
diseaseSchema.index({ name: 1, department: 1 }, { unique: true });

// Virtual for image URL
diseaseSchema.virtual('imageUrl').get(function() {
  if (this.iconimg) {
    return `/uploads/diseases/${this.iconimg}`;
  }
  return '/placeholder.png';
});

// Instance method to toggle active status
diseaseSchema.methods.toggleActive = function() {
  this.isActive = !this.isActive;
  return this.save();
};

// Static method to get active diseases
diseaseSchema.statics.getActiveDiseases = function() {
  return this.find({ isActive: true }).sort({ sortOrder: 1 });
};

module.exports = mongoose.model('Disease', diseaseSchema);