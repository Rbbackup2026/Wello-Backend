// models/Blog.js
const mongoose = require("mongoose");

const BlogSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    intro: { type: String },
    description: { type: String }, // rich html
    category: { type: String },
    tags: { type: [String], default: [] },
    image: { type: String, default: null }, // url path e.g. /uploads/xxx.jpg
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive", "draft"], default: "active" },
    setAtHome: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Blog", BlogSchema);
