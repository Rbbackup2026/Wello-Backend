const mongoose = require("mongoose");

const CarouselItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  desc: { type: String },
  image: { type: String, required: true }, // 🔥 This MUST be set correctly
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("CarouselItem", CarouselItemSchema);
