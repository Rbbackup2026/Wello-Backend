const mongoose = require("mongoose");

const blogTagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    sortOrder: {
      type: Number,
      default: 1,
    },

    mostUsed: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("BlogTag", blogTagSchema);
