// // models/Pincode.js
// const mongoose = require('mongoose');

// const PincodeSchema = new mongoose.Schema({
//   pincode: { type: String, required: true, index: true },
//   officeName: { type: String, default: '', index: true },
//   division: { type: String, default: '' },
//   region: { type: String, default: '' },
//   circle: { type: String, default: '' },
//   district: { type: String, default: '', index: true },
//   state: { type: String, default: '', index: true },
//   latitude: { type: Number },
//   longitude: { type: Number },
// }, { timestamps: false });

// PincodeSchema.index({ officeName: 'text', district: 'text', state: 'text' });

// module.exports = mongoose.model('Pincode', PincodeSchema);
