const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  department: {
    type: String,
    required: true,
    trim: true,
  },
  iconimg: {
    type: String,
    required: true,
    trim: true,
  },
  bannerimg: {
    type: String,
    required: true,
    trim: true,
  },
  sortOrder: {
    type: Number,
  },
  showinhome: {
    type: Boolean,
    default: false,
  },
  showhomebanner: {
    type: Boolean,
    default: false,
  },
  status: {
    type: Boolean,
    default: true,
  },
  pagedescription: {
    type: String,
    default: "",
  },
}); 

module.exports = mongoose.model("Category", categorySchema);
