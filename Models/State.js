const mongoose = require('mongoose');

const stateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'State name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'State name cannot exceed 100 characters']
  },
  apiId: {
    type: String,
    required: [true, 'State API ID is required'],
    trim: true,
    unique: true,
    uppercase: true,
    maxlength: [10, 'API ID cannot exceed 10 characters']
  },
  sortOrder: {
    type: Number,
    required: [true, 'Sort order is required'],
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

// Compound index for unique constraint
stateSchema.index({ name: 1 }, { unique: true });
stateSchema.index({ apiId: 1 }, { unique: true });

// Virtual for createdAt date in YYYY-MM-DD format
stateSchema.virtual('createdAtFormatted').get(function() {
  return this.createdAt.toISOString().split('T')[0];
});

// Ensure virtual fields are serialized
stateSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('State', stateSchema);