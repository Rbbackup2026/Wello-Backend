const mongoose = require('mongoose');
const { image } = require('pdfkit');
const departmentSchema = new mongoose.Schema({
    image: {
        type: String,
        required: true,
        trim: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    sortOrder: {
        type: Number,
    },
    status: {
        type: Boolean,
        default: true,
    },
})
const Department = mongoose.model('Department', departmentSchema);
module.exports = Department;