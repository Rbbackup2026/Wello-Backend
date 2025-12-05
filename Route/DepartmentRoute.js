const Department = require('../Models/Department');
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// ===== Multer Config ===== //
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const isValidExt = allowed.test(path.extname(file.originalname).toLowerCase());
  const isValidMime = allowed.test(file.mimetype);
  if (isValidExt && isValidMime) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
}

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter,
});

// ===== Route: Create Department ===== //
// ===== Route: Create Department ===== //
router.post('/create-department', (req, res, next) => {
  upload.single('image')(req, res, function (err) {
    if (err && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large' });
    }
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { name, status } = req.body;

    if (!name || !status) {
      return res.status(400).json({ message: 'Name and status are required' });
    }

    // Get last sortOrder and increment it
    const lastDepartment = await Department.findOne().sort({ sortOrder: -1 }).limit(1);
    const newSortOrder = lastDepartment ? lastDepartment.sortOrder + 1 : 1;

    const newDepartment = await Department.create({
      name,
      sortOrder: newSortOrder,
      status: status === 'true',
      image: req.file ? req.file.path : null,
    });

    res.status(201).json({
      message: 'Department created successfully',
      department: newDepartment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

// ===== Route: Get All Departments ===== //
router.get('/get-departments', async (req, res) => {
  try {
    const departments = await Department.find().sort({ sortOrder: 1 });
    res.status(200).json({ message: 'Departments fetched successfully', departments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

// ===== Route: Update Department ===== //

router.put('/update-department/:id', (req, res, next) => {
  upload.single('image')(req, res, function (err) {
    if (err && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large' });
    }
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sortOrder, status } = req.body;

    if (!name || !status) {
      return res.status(400).json({ message: 'Name and status are required' });
    }

    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    const finalSortOrder = sortOrder
      ? parseInt(sortOrder)
      : ((await Department.findOne().sort({ sortOrder: -1 }))?.sortOrder || 0) + 1;
    const updatedDepartment = await Department.findByIdAndUpdate(
      id,
      {
        name,
        sortOrder: finalSortOrder,
        status: status === 'true',
        image: req.file ? req.file.path : department.image, // Keep old image if new one is not provided
      },
      { new: true }
    );
    if (req.file && department.image) { 
      // Delete old image if a new one is uploaded
      fs.unlink(department.image, (err) => {
        if (err) console.error('Error deleting old image:', err);
      });
    }
    res.status(200).json({ message: 'Department updated successfully', department: updatedDepartment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
}
);
// ===== Route: Delete Department ===== //
router.delete('/delete-department/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    await Department.findByIdAndDelete(id);
    if (department.image) {
      fs.unlink(department.image, (err) => {
        if (err) console.error('Error deleting image:', err);
      });
    }
    res.status(200).json({ message: 'Department deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

//====get by id====//
router.get('/get-department/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.status(200).json({ message: 'Department fetched successfully', department });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
}
);


module.exports = router;
