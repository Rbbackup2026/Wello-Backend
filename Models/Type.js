const mongoose = require('mongoose');

const typeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Type name is required'],
    trim: true,
    maxlength: [100, 'Type name cannot exceed 100 characters'],
    unique: true
  },
  iconimg: {
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
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Index for better performance
typeSchema.index({ sortOrder: 1 });
typeSchema.index({ status: 1 });

// Virtual for image URL
typeSchema.virtual('imageUrl').get(function() {
  if (this.iconimg) {
    return `/uploads/types/${this.iconimg}`;
  }
  return '/placeholder.png';
});

// Instance method to toggle status
typeSchema.methods.toggleStatus = function() {
  this.status = !this.status;
  return this.save();
};

// Static method to get active types
typeSchema.statics.getActiveTypes = function() {
  return this.find({ status: true }).sort({ sortOrder: 1 });
};

module.exports = mongoose.model('Type', typeSchema);

