const express = require('express');
const router = express.Router();
const Disease = require('../Models/Disease');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'public/uploads/diseases/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'disease-' + uniqueSuffix + path.extname(file.originalname));
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
    fileSize: 5 * 1024 * 1024
  }
});

// GET all diseases with search, pagination and filters
router.get('/diseasepost', async (req, res) => {
  try {
    const { 
      search, 
      page = 1, 
      limit = 10, 
      status, 
      isActive,
      department,
      showHome 
    } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (department) {
      filter.department = { $regex: department, $options: 'i' };
    }

    if (showHome !== undefined) {
      filter.showHome = showHome === 'true';
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { sortOrder: 1, createdAt: -1 }
    };

    const diseases = await Disease.find(filter)
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit);

    const total = await Disease.countDocuments(filter);

    res.json({
      diseases,
      totalPages: Math.ceil(total / options.limit),
      currentPage: options.page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single disease by ID
router.get('/diseasepost/:id', async (req, res) => {
  try {
    const disease = await Disease.findById(req.params.id);
    if (!disease) {
      return res.status(404).json({ message: 'Disease not found' });
    }
    res.json(disease);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET active diseases only (for public APIs)
router.get('/diseasepost/active/list', async (req, res) => {
  try {
    const diseases = await Disease.getActiveDiseases();
    res.json(diseases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE new disease
router.post('/diseasepost', upload.single('iconimg'), async (req, res) => {
  try {
    const { 
      name, 
      department, 
      sortOrder, 
      showHome, 
      status, 
      description,
      isActive 
    } = req.body;

    // Check if disease already exists
    const existingDisease = await Disease.findOne({ name, department });
    if (existingDisease) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'Disease already exists in this department' });
    }

    const diseaseData = {
      name,
      department,
      sortOrder: parseInt(sortOrder),
      showHome: showHome === 'true',
      status: status || 'Active',
      description,
      isActive: isActive !== undefined ? isActive === 'true' : true
    };

    // Add image filename if uploaded
    if (req.file) {
      diseaseData.iconimg = req.file.filename;
    }

    const disease = new Disease(diseaseData);
    const newDisease = await disease.save();
    
    res.status(201).json({
      message: 'Disease created successfully',
      disease: newDisease
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(400).json({ message: error.message });
  }
});

// UPDATE disease
router.put('/diseasepost/:id', upload.single('iconimg'), async (req, res) => {
  try {
    const { 
      name, 
      department, 
      sortOrder, 
      showHome, 
      status, 
      description,
      isActive 
    } = req.body;

    // Check if disease exists
    const disease = await Disease.findById(req.params.id);
    if (!disease) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: 'Disease not found' });
    }

    // Check for duplicate disease name
    const existingDisease = await Disease.findOne({
      name,
      department,
      _id: { $ne: req.params.id }
    });
    
    if (existingDisease) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'Disease already exists in this department' });
    }

    const updateData = {
      name,
      department,
      sortOrder: parseInt(sortOrder),
      showHome: showHome === 'true',
      status: status || 'Active',
      description
    };

    // Add isActive if provided
    if (isActive !== undefined) {
      updateData.isActive = isActive === 'true';
    }

    // Handle image update
    if (req.file) {
      // Delete old image if exists
      if (disease.iconimg) {
        const oldImagePath = path.join('public/uploads/diseases/', disease.iconimg);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateData.iconimg = req.file.filename;
    }

    const updatedDisease = await Disease.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Disease updated successfully',
      disease: updatedDisease
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(400).json({ message: error.message });
  }
});

// DELETE single disease
router.delete('/diseasepost/:id', async (req, res) => {
  try {
    const disease = await Disease.findById(req.params.id);
    if (!disease) {
      return res.status(404).json({ message: 'Disease not found' });
    }

    // Delete associated image
    if (disease.iconimg) {
      const imagePath = path.join('public/uploads/diseases/', disease.iconimg);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Disease.findByIdAndDelete(req.params.id);
    res.json({ message: 'Disease deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// BULK DELETE diseases
router.delete('/diseasepost', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No disease IDs provided' });
    }

    const diseases = await Disease.find({ _id: { $in: ids } });
    
    // Delete associated images
    diseases.forEach(disease => {
      if (disease.iconimg) {
        const imagePath = path.join('public/uploads/diseases/', disease.iconimg);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
    });

    const result = await Disease.deleteMany({ _id: { $in: ids } });
    
    res.json({ 
      message: `${result.deletedCount} disease(s) deleted successfully` 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// TOGGLE disease status (Active/Inactive)
router.patch('/diseasepost/:id/toggle-status', async (req, res) => {
  try {
    const disease = await Disease.findById(req.params.id);
    if (!disease) {
      return res.status(404).json({ message: 'Disease not found' });
    }

    disease.status = disease.status === 'Active' ? 'Inactive' : 'Active';
    const updatedDisease = await disease.save();
    
    res.json({
      message: `Disease ${updatedDisease.status === 'Active' ? 'activated' : 'deactivated'} successfully`,
      disease: updatedDisease
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// TOGGLE active flag (isActive) - using the instance method
router.patch('/diseasepost/:id/toggle-active', async (req, res) => {
  try {
    const disease = await Disease.findById(req.params.id);
    if (!disease) {
      return res.status(404).json({ message: 'Disease not found' });
    }

    const updatedDisease = await disease.toggleActive();
    
    res.json({
      message: `Disease ${updatedDisease.isActive ? 'activated' : 'deactivated'} successfully`,
      disease: updatedDisease
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// BULK TOGGLE active status
router.patch('/diseasepost/bulk/toggle-active', async (req, res) => {
  try {
    const { ids, isActive } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No disease IDs provided' });
    }

    if (isActive === undefined) {
      return res.status(400).json({ message: 'isActive status is required' });
    }

    const result = await Disease.updateMany(
      { _id: { $in: ids } },
      { $set: { isActive: isActive } }
    );

    res.json({
      message: `${result.modifiedCount} disease(s) ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// BULK UPDATE status
router.patch('/diseasepost/bulk/update-status', async (req, res) => {
  try {
    const { ids, status } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No disease IDs provided' });
    }

    if (!status || !['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required' });
    }

    const result = await Disease.updateMany(
      { _id: { $in: ids } },
      { $set: { status: status } }
    );

    res.json({
      message: `${result.modifiedCount} disease(s) status updated to ${status}`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET disease statistics
router.get('/diseasepost/stats/counts', async (req, res) => {
  try {
    const total = await Disease.countDocuments();
    const active = await Disease.countDocuments({ isActive: true });
    const inactive = await Disease.countDocuments({ isActive: false });
    const showHome = await Disease.countDocuments({ showHome: true });
    
    res.json({
      total,
      active,
      inactive,
      showHome
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;