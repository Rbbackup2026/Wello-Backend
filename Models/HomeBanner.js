const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  image: {
    type: String, // path or URL to the uploaded image
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Banner', bannerSchema);
