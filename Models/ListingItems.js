const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discountPrice: {
    type: Number,
    default: null,
    min: 0
  },
  images: [
    {
      url: { type: String, required: true }
    }
  ],
  stockQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  sku: {
    type: String,
    unique: true,
    required: true
  },
  brand: {
    type: String
  },
  ratingsAverage: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingsCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', productSchema);









// Jarurat padne par niche wale code ko uncomment kar sakte ho // // Optional fields and sub-schemas



// const mongoose = require('mongoose');

// // Review schema for product reviews by users
// const reviewSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   userName: { type: String, required: true },
//   rating: { type: Number, required: true, min: 1, max: 5 },
//   comment: { type: String }, // Optional
//   createdAt: { type: Date, default: Date.now } // Optional
// });

// // Variant schema for different product versions (size/color)
// const variantSchema = new mongoose.Schema({
//   color: { type: String }, // Optional
//   size: { type: String },  // Optional
//   price: { type: Number, required: true, min: 0 },
//   stockQuantity: { type: Number, required: true, min: 0 },
//   images: [
//     {
//       url: { type: String, required: true }
//     }
//   ]
// });

// // Main Product schema
// const productSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     trim: true
//   },

//   description: {
//     type: String,
//     required: true
//   },

//   category: {
//     type: String,
//     required: true,
//     index: true
//   },

//   price: { // Base price (can be overridden by variants)
//     type: Number,
//     required: true,
//     min: 0
//   },

//   discountPrice: { // Optional
//     type: Number,
//     default: null,
//     min: 0
//   },

//   images: [
//     {
//       url: { type: String, required: true }
//     }
//   ],

//   stockQuantity: {
//     type: Number,
//     required: true,
//     min: 0
//   },

//   sku: {
//     type: String,
//     unique: true,
//     required: true
//   },

//   brand: { type: String }, // Optional

//   ratingsAverage: { // Optional
//     type: Number,
//     default: 0,
//     min: 0,
//     max: 5
//   },

//   ratingsCount: { // Optional
//     type: Number,
//     default: 0
//   },

//   isActive: { // Optional
//     type: Boolean,
//     default: true
//   },

//   createdAt: { // Optional
//     type: Date,
//     default: Date.now
//   },

//   // Additional optional fields

//   tags: [{ type: String }], // Optional, e.g. ["summer", "cotton", "sale"]

//   specifications: { // Optional key-value pairs for product specs
//     type: Map,
//     of: String
//   },

//   variants: [variantSchema], // Optional, for size/color variants

//   reviews: [reviewSchema] // Optional, user reviews
// });

// module.exports = mongoose.model('Product', productSchema);
