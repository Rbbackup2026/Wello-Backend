const express = require('express');
const router = express.Router();
const Lab = require('../Models/Lab');
const multer = require('multer');
const path = require('path');

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/labs/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'lab-' + uniqueSuffix + path.extname(file.originalname));
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

// @desc    Get all labs
// @route   GET /api/labs
// @access  Public
router.get('/getlab', async (req, res) => {
  try {
    const { city, labType, status, search } = req.query;
    
    // Build filter object
    let filter = {};
    
    if (city) filter.city = new RegExp(city, 'i');
    if (labType) filter.labType = labType;
    if (status) filter.status = status;
    
    if (search) {
      filter.$or = [
        { labName: new RegExp(search, 'i') },
        { labId: new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') }
      ];
    }

    const labs = await Lab.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .select('-__v');
    
    res.json({
      success: true,
      count: labs.length,
      data: labs
    });
  } catch (error) {
    console.error('Get labs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching labs',
      error: error.message
    });
  }
});

// @desc    Get single lab by ID
// @route   GET /api/labs/:id
// @access  Public
router.get('/getlab/:id', async (req, res) => {
  try {
    const lab = await Lab.findById(req.params.id);
    
    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Lab not found'
      });
    }

    res.json({
      success: true,
      data: lab
    });
  } catch (error) {
    console.error('Get lab error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Lab not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching lab',
      error: error.message
    });
  }
});

// @desc    Create new lab
// @route   POST /api/labs
// @access  Private/Admin
router.post('/post_lab', upload.single('image'), async (req, res) => {
  try {
    const {
      city,
      labName,
      labId,
      labelCode,
      panelId,
      centreId,
      labType,
      phoneNumber,
      email,
      address,
      sortOrder,
      status
    } = req.body;

    // Check if lab with same labId already exists
    const existingLab = await Lab.findOne({ labId: labId.toUpperCase() });
    if (existingLab) {
      return res.status(400).json({
        success: false,
        message: 'Lab with this Lab ID already exists'
      });
    }

    const labData = {
      city: city.trim(),
      labName: labName.trim(),
      labId: labId.toUpperCase(),
      labelCode: labelCode.toUpperCase(),
      panelId: panelId?.trim(),
      centreId: centreId?.trim(),
      labType: labType || 'Main Lab',
      phoneNumber: phoneNumber?.trim(),
      email: email?.trim().toLowerCase(),
      address: address.trim(),
      sortOrder: sortOrder || 1,
      status: status || 'active'
    };

    // Add image URL if file was uploaded
    if (req.file) {
      labData.imageUrl = `/uploads/labs/${req.file.filename}`;
    }

    const lab = await Lab.create(labData);

    res.status(201).json({
      success: true,
      message: 'Lab created successfully',
      data: lab
    });
  } catch (error) {
    console.error('Create lab error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Lab with this Lab ID already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while creating lab',
      error: error.message
    });
  }
});

// @desc    Update lab
// @route   PUT /api/labs/:id
// @access  Private/Admin
router.put('/put/:id', upload.single('image'), async (req, res) => {
  try {
    const {
      city,
      labName,
      labId,
      labelCode,
      panelId,
      centreId,
      labType,
      phoneNumber,
      email,
      address,
      sortOrder,
      status
    } = req.body;

    let lab = await Lab.findById(req.params.id);
    
    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Lab not found'
      });
    }

    // Check if lab with same labId already exists (excluding current lab)
    if (labId && labId.toUpperCase() !== lab.labId) {
      const existingLab = await Lab.findOne({ 
        labId: labId.toUpperCase(),
        _id: { $ne: req.params.id } 
      });
      if (existingLab) {
        return res.status(400).json({
          success: false,
          message: 'Lab with this Lab ID already exists'
        });
      }
    }

    const updateData = {};
    if (city) updateData.city = city.trim();
    if (labName) updateData.labName = labName.trim();
    if (labId) updateData.labId = labId.toUpperCase();
    if (labelCode) updateData.labelCode = labelCode.toUpperCase();
    if (panelId !== undefined) updateData.panelId = panelId?.trim();
    if (centreId !== undefined) updateData.centreId = centreId?.trim();
    if (labType) updateData.labType = labType;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber?.trim();
    if (email !== undefined) updateData.email = email?.trim().toLowerCase();
    if (address) updateData.address = address.trim();
    if (sortOrder) updateData.sortOrder = sortOrder;
    if (status) updateData.status = status;

    // Update image URL if new file was uploaded
    if (req.file) {
      updateData.imageUrl = `/uploads/labs/${req.file.filename}`;
    }

    lab = await Lab.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      message: 'Lab updated successfully',
      data: lab
    });
  } catch (error) {
    console.error('Update lab error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Lab with this Lab ID already exists'
      });
    }
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Lab not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while updating lab',
      error: error.message
    });
  }
});

// @desc    Delete lab
// @route   DELETE /api/labs/:id
// @access  Private/Admin
router.delete('/delete_lab/:id', async (req, res) => {
  try {
    const lab = await Lab.findById(req.params.id);
    
    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Lab not found'
      });
    }

    await Lab.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Lab deleted successfully'
    });
  } catch (error) {
    console.error('Delete lab error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Lab not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while deleting lab',
      error: error.message
    });
  }
});

// @desc    Toggle lab status
// @route   PATCH /api/labs/:id/toggle-status
// @access  Private/Admin
router.patch('/:id/toggle-status', async (req, res) => {
  try {
    const lab = await Lab.findById(req.params.id);
    
    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Lab not found'
      });
    }

    lab.status = lab.status === 'active' ? 'inactive' : 'active';
    await lab.save();

    res.json({
      success: true,
      message: `Lab status updated to ${lab.status}`,
      data: lab
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Lab not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while updating lab status',
      error: error.message
    });
  }
});

// @desc    Get active labs only
// @route   GET /api/labs/active
// @access  Public
router.get('/active', async (req, res) => {
  try {
    const labs = await Lab.find({ status: 'active' })
      .sort({ sortOrder: 1, labName: 1 })
      .select('labName labId city labType imageUrl sortOrder');

    res.json({
      success: true,
      count: labs.length,
      data: labs
    });
  } catch (error) {
    console.error('Get active labs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching active labs',
      error: error.message
    });
  }
});

// @desc    Get cities list
// @route   GET /api/labs/cities/list
// @access  Public
router.get('/cities/list', async (req, res) => {
  try {
    const cities = await Lab.distinct('city', { status: 'active' });
    
    res.json({
      success: true,
      data: cities.sort()
    });
  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching cities',
      error: error.message
    });
  }
});

module.exports = router;