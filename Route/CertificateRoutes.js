const express = require('express');
const router = express.Router();
const Certificate = require('../Models/Certificate');
const multer = require('multer');
const path = require('path');

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/certificates/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'certificate-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// @desc    Get all certificates
// @route   GET /api/certificates
// @access  Public
router.get('/certificate_upload', async (req, res) => {
  try {
    const certificates = await Certificate.find()
      .sort({ sortOrder: 1, createdAt: -1 })
      .select('-__v');
    
    res.json({
      success: true,
      count: certificates.length,
      data: certificates
    });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching certificates',
      error: error.message
    });
  }
});

// @desc    Get single certificate by ID
// @route   GET /api/certificates/:id
// @access  Public
router.get('/certificatget/:id', async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    res.json({
      success: true,
      data: certificate
    });
  } catch (error) {
    console.error('Get certificate error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching certificate',
      error: error.message
    });
  }
});

// @desc    Create new certificate
// @route   POST /api/certificates
// @access  Private/Admin
router.post('/certificate_upload', upload.single('image'), async (req, res) => {
  try {
    const { name, sortOrder, status } = req.body;

    // Check if certificate with same name already exists
    const existingCertificate = await Certificate.findOne({ name });
    if (existingCertificate) {
      return res.status(400).json({
        success: false,
        message: 'Certificate with this name already exists'
      });
    }

    const certificateData = {
      name,
      sortOrder: sortOrder || 1,
      status: status || 'active'
    };

    // Add image URL if file was uploaded
    if (req.file) {
      certificateData.imageUrl = `/uploads/certificates/${req.file.filename}`;
    }

    const certificate = await Certificate.create(certificateData);

    res.status(201).json({
      success: true,
      message: 'Certificate created successfully',
      data: certificate
    });
  } catch (error) {
    console.error('Create certificate error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while creating certificate',
      error: error.message
    });
  }
});

// @desc    Update certificate
// @route   PUT /api/certificates/:id
// @access  Private/Admin
router.put('/put/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, sortOrder, status } = req.body;

    let certificate = await Certificate.findById(req.params.id);
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Check if certificate with same name already exists (excluding current certificate)
    if (name && name !== certificate.name) {
      const existingCertificate = await Certificate.findOne({ 
        name, 
        _id: { $ne: req.params.id } 
      });
      if (existingCertificate) {
        return res.status(400).json({
          success: false,
          message: 'Certificate with this name already exists'
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (sortOrder) updateData.sortOrder = sortOrder;
    if (status) updateData.status = status;

    // Update image URL if new file was uploaded
    if (req.file) {
      updateData.imageUrl = `/uploads/certificates/${req.file.filename}`;
    }

    certificate = await Certificate.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      message: 'Certificate updated successfully',
      data: certificate
    });
  } catch (error) {
    console.error('Update certificate error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while updating certificate',
      error: error.message
    });
  }
});

// @desc    Delete certificate
// @route   DELETE /api/certificates/:id
// @access  Private/Admin
router.delete('/:id', async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    await Certificate.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Certificate deleted successfully'
    });
  } catch (error) {
    console.error('Delete certificate error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while deleting certificate',
      error: error.message
    });
  }
});

// @desc    Toggle certificate status
// @route   PATCH /api/certificates/:id/toggle-status
// @access  Private/Admin
router.patch('/:id/toggle-status', async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    certificate.status = certificate.status === 'active' ? 'inactive' : 'active';
    await certificate.save();

    res.json({
      success: true,
      message: `Certificate status updated to ${certificate.status}`,
      data: certificate
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while updating certificate status',
      error: error.message
    });
  }
});

// @desc    Get active certificates only
// @route   GET /api/certificates/active
// @access  Public
router.get('/active', async (req, res) => {
  try {
    const certificates = await Certificate.find({ status: 'active' })
      .sort({ sortOrder: 1 })
      .select('name imageUrl sortOrder');

    res.json({
      success: true,
      count: certificates.length,
      data: certificates
    });
  } catch (error) {
    console.error('Get active certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching active certificates',
      error: error.message
    });
  }
});

module.exports = router;