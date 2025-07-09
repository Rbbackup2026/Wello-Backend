const mongoose = require("mongoose");
const keyFeatureSchema = new mongoose.Schema({
  name: { type: String, required: true },
  keyimg: { type: String, required: true },
  status: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    info: { type: String, default: "" },

});
const KeyFeature = mongoose.model("KeyFeature", keyFeatureSchema);
module.exports = KeyFeature;