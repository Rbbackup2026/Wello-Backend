const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  display: {
    type: String,
    required: true,
    enum: ["home", "premium", "pathology"]
  },
  city: {
    type: String,
    default: ""
  },
  link: {
    type: String,
    default: ""
  },
  sortId: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active"
  },
  webImage: {
    type: String,
    required: true
  },
  appImage: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('HomeBanner', bannerSchema);
