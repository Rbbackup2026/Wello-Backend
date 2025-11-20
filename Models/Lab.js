const mongoose = require('mongoose');

const labSchema = new mongoose.Schema({
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: [100, 'City name cannot exceed 100 characters']
  },
  labName: {
    type: String,
    required: [true, 'Lab name is required'],
    trim: true,
    maxlength: [200, 'Lab name cannot exceed 200 characters']
  },
  labId: {
    type: String,
    required: [true, 'Lab ID is required'],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [50, 'Lab ID cannot exceed 50 characters']
  },
  labelCode: {
    type: String,
    required: [true, 'Label code is required'],
    trim: true,
    uppercase: true,
    maxlength: [20, 'Label code cannot exceed 20 characters']
  },
  panelId: {
    type: String,
    trim: true,
    maxlength: [50, 'Panel ID cannot exceed 50 characters']
  },
  centreId: {
    type: String,
    trim: true,
    maxlength: [50, 'Centre ID cannot exceed 50 characters']
  },
  labType: {
    type: String,
    enum: ['Main Lab', 'Branch Lab', 'Collection Center', 'Partner Lab'],
    default: 'Main Lab'
  },
  phoneNumber: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^\d{10}$/.test(v);
      },
      message: 'Phone number must be a valid 10-digit number'
    }
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return !v || /\S+@\S+\.\S+/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
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
  }
}, {
  timestamps: true
});

// Indexes for better performance
labSchema.index({ labId: 1 }, { unique: true });
labSchema.index({ city: 1, status: 1 });
labSchema.index({ sortOrder: 1 });
labSchema.index({ createdAt: -1 });

// Pre-save middleware to ensure uppercase for specific fields
labSchema.pre('save', function(next) {
  if (this.labId) {
    this.labId = this.labId.toUpperCase();
  }
  if (this.labelCode) {
    this.labelCode = this.labelCode.toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Lab', labSchema);