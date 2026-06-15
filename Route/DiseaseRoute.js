const express = require('express');
const router = express.Router();
const Disease = require('../Models/Disease');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// =============================================
// Cloudinary Configuration
// =============================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =============================================
// Multer + Cloudinary Storage
// =============================================
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'diseases', // Cloudinary mein "diseases" folder mein save hoga
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// =============================================
// HELPER: Format disease object with imageUrl
// =============================================
const formatDisease = (disease) => {
  const obj = disease.toObject ? disease.toObject() : { ...disease };
  // iconimg ab Cloudinary ka poora URL hai
  obj.imageUrl = obj.iconimg || null;
  return obj;
};

// Helper: Delete image from Cloudinary
const deleteFromCloudinary = async (iconimg) => {
  if (!iconimg) return;
  try {
    // Cloudinary URL se public_id nikalo
    // URL format: https://res.cloudinary.com/cloud_name/image/upload/v123/diseases/filename.jpg
    const urlParts = iconimg.split('/');
    const fileName = urlParts[urlParts.length - 1].split('.')[0]; // filename without extension
    const folderIndex = urlParts.indexOf('diseases');
    if (folderIndex !== -1) {
      const publicId = `diseases/${fileName}`;
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (err) {
    console.error('Cloudinary delete error:', err);
  }
};

// =============================================
// GET all diseases (search, pagination, filters)
// =============================================
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

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'all') filter.status = status;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (department) filter.department = { $regex: department, $options: 'i' };
    if (showHome !== undefined) filter.showHome = showHome === 'true';

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { sortOrder: 1, createdAt: -1 }
    };

    const diseases = await Disease.find(filter)
      .sort(options.sort)
      .limit(options.limit)
      .skip((options.page - 1) * options.limit);

    const total = await Disease.countDocuments(filter);

    res.json({
      diseases: diseases.map(formatDisease),
      totalPages: Math.ceil(total / options.limit),
      currentPage: options.page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =============================================
// GET active diseases only (public API)
// =============================================
router.get('/diseasepost/active/list', async (req, res) => {
  try {
    const diseases = await Disease.getActiveDiseases();
    res.json(diseases.map(formatDisease));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =============================================
// GET disease statistics
// =============================================
router.get('/diseasepost/stats/counts', async (req, res) => {
  try {
    const total = await Disease.countDocuments();
    const active = await Disease.countDocuments({ isActive: true });
    const inactive = await Disease.countDocuments({ isActive: false });
    const showHome = await Disease.countDocuments({ showHome: true });

    res.json({ total, active, inactive, showHome });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =============================================
// GET single disease by ID
// =============================================
router.get('/diseasepost/:id', async (req, res) => {
  try {
    const disease = await Disease.findById(req.params.id);
    if (!disease) {
      return res.status(404).json({ message: 'Disease not found' });
    }
    res.json(formatDisease(disease));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =============================================
// CREATE new disease
// =============================================
router.post('/diseasepost', upload.single('iconimg'), async (req, res) => {
  try {
    const { name, department, sortOrder, showHome, status, description, isActive } = req.body;

    // Duplicate check
    const existingDisease = await Disease.findOne({ name, department });
    if (existingDisease) {
      // Agar image upload ho gayi thi to Cloudinary se delete karo
      if (req.file) await deleteFromCloudinary(req.file.path);
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

    // ✅ Cloudinary URL directly save karo (req.file.path = Cloudinary URL)
    if (req.file) {
      diseaseData.iconimg = req.file.path;
    }

    const disease = new Disease(diseaseData);
    const newDisease = await disease.save();

    res.status(201).json({
      message: 'Disease created successfully',
      disease: formatDisease(newDisease)
    });
  } catch (error) {
    if (req.file) await deleteFromCloudinary(req.file.path);
    res.status(400).json({ message: error.message });
  }
});

// =============================================
// UPDATE disease
// =============================================
router.put('/diseasepost/:id', upload.single('iconimg'), async (req, res) => {
  try {
    const { name, department, sortOrder, showHome, status, description, isActive } = req.body;

    const disease = await Disease.findById(req.params.id);
    if (!disease) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(404).json({ message: 'Disease not found' });
    }

    // Duplicate check
    const existingDisease = await Disease.findOne({
      name,
      department,
      _id: { $ne: req.params.id }
    });
    if (existingDisease) {
      if (req.file) await deleteFromCloudinary(req.file.path);
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

    if (isActive !== undefined) {
      updateData.isActive = isActive === 'true';
    }

    // ✅ Nai image upload hui to purani Cloudinary se delete karo
    if (req.file) {
      if (disease.iconimg) {
        await deleteFromCloudinary(disease.iconimg);
      }
      updateData.iconimg = req.file.path; // Cloudinary URL
    }

    const updatedDisease = await Disease.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Disease updated successfully',
      disease: formatDisease(updatedDisease)
    });
  } catch (error) {
    if (req.file) await deleteFromCloudinary(req.file.path);
    res.status(400).json({ message: error.message });
  }
});

// =============================================
// DELETE single disease
// =============================================
router.delete('/diseasepost/:id', async (req, res) => {
  try {
    const disease = await Disease.findById(req.params.id);
    if (!disease) {
      return res.status(404).json({ message: 'Disease not found' });
    }

    // ✅ Cloudinary se image delete karo
    if (disease.iconimg) {
      await deleteFromCloudinary(disease.iconimg);
    }

    await Disease.findByIdAndDelete(req.params.id);
    res.json({ message: 'Disease deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =============================================
// BULK DELETE diseases
// =============================================
router.delete('/diseasepost', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No disease IDs provided' });
    }

    const diseases = await Disease.find({ _id: { $in: ids } });

    // ✅ Cloudinary se sabki images delete karo
    await Promise.all(diseases.map(d => deleteFromCloudinary(d.iconimg)));

    const result = await Disease.deleteMany({ _id: { $in: ids } });

    res.json({ message: `${result.deletedCount} disease(s) deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =============================================
// TOGGLE status (Active/Inactive)
// =============================================
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
      disease: formatDisease(updatedDisease)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =============================================
// TOGGLE isActive flag
// =============================================
router.patch('/diseasepost/:id/toggle-active', async (req, res) => {
  try {
    const disease = await Disease.findById(req.params.id);
    if (!disease) {
      return res.status(404).json({ message: 'Disease not found' });
    }

    const updatedDisease = await disease.toggleActive();

    res.json({
      message: `Disease ${updatedDisease.isActive ? 'activated' : 'deactivated'} successfully`,
      disease: formatDisease(updatedDisease)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =============================================
// BULK TOGGLE isActive
// =============================================
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
      { $set: { isActive } }
    );

    res.json({
      message: `${result.modifiedCount} disease(s) ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =============================================
// BULK UPDATE status
// =============================================
router.patch('/diseasepost/bulk/update-status', async (req, res) => {
  try {
    const { ids, status } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No disease IDs provided' });
    }
    if (!status || !['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required (Active or Inactive)' });
    }

    const result = await Disease.updateMany(
      { _id: { $in: ids } },
      { $set: { status } }
    );

    res.json({
      message: `${result.modifiedCount} disease(s) status updated to ${status}`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;