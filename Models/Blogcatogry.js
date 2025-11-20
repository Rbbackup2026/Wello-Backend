const mongoose = require('mongoose');

const blogCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  sortOrder: {
    type: Number,
    required: true,
    min: [1, 'Sort order must be at least 1'],
    default: 1
  },
  status: {
    type: String,
    enum: {
      values: ['Active', 'Inactive'],
      message: 'Status must be either Active or Inactive'
    },
    default: 'Active'
  }
}, {
  timestamps: true
});

// Auto increment sortOrder for new categories
blogCategorySchema.pre('save', async function(next) {
  if (this.isNew && !this.sortOrder) {
    const lastCategory = await this.constructor.findOne().sort('-sortOrder');
    this.sortOrder = lastCategory ? lastCategory.sortOrder + 1 : 1;
  }
  next();
});

// Prevent duplicate category names
blogCategorySchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('BlogCategory', blogCategorySchema);