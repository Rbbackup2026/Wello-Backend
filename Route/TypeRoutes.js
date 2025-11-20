const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Type = require('../Models/Type');

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'types');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `type-${Date.now()}-${Math.floor(Math.random() * 1e6)}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const isValidExt = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const isValidMime = allowedTypes.test(file.mimetype);

  if (isValidExt && isValidMime) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

// ✅ GET ALL TYPES
router.get('/types_get', async (req, res) => {
  try {
    const types = await Type.find().sort({ sortOrder: 1 });
    
    res.status(200).json(types);
  } catch (error) {
    console.error('Error fetching types:', error);
    res.status(500).json({ message: 'Server error while fetching types' });
  }
});

// ✅ GET SINGLE TYPE BY ID
router.get('/types_get/:id', async (req, res) => {
  try {
    const type = await Type.findById(req.params.id);
    
    if (!type) {
      return res.status(404).json({ message: 'Type not found' });
    }

    res.status(200).json(type);
  } catch (error) {
    console.error('Error fetching type:', error);
    res.status(500).json({ message: 'Server error while fetching type' });
  }
});

// ✅ CREATE NEW TYPE
router.post('/types', upload.single('iconimg'), async (req, res) => {
  try {
    const { name, sortOrder, status, description } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({ message: 'Type name is required' });
    }

    // Check if type already exists
    const existingType = await Type.findOne({ name });
    if (existingType) {
      return res.status(400).json({ message: 'Type with this name already exists' });
    }

    // Get last sortOrder
    const lastType = await Type.findOne().sort({ sortOrder: -1 });
    const newSortOrder = lastType ? lastType.sortOrder + 1 : 1;

    // Create type data
    const typeData = {
      name: name.trim(),
      sortOrder: sortOrder ? parseInt(sortOrder) : newSortOrder,
      status: status === 'true' || status === true,
      description: description || ''
    };

    // Add image if uploaded
    if (req.file) {
      typeData.iconimg = req.file.filename;
    }

    const type = await Type.create(typeData);

    res.status(201).json({
      message: 'Type created successfully',
      data: type
    });
  } catch (error) {
    console.error('Error creating type:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Type name must be unique' });
    }

    res.status(500).json({ message: 'Server error while creating type' });
  }
});

// ✅ UPDATE TYPE
router.put('/types_put/:id', upload.single('iconimg'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sortOrder, status, description } = req.body;

    // Find existing type
    const existingType = await Type.findById(id);
    if (!existingType) {
      return res.status(404).json({ message: 'Type not found' });
    }

    // Check if name is being changed and if it already exists
    if (name && name !== existingType.name) {
      const nameExists = await Type.findOne({ name, _id: { $ne: id } });
      if (nameExists) {
        return res.status(400).json({ message: 'Type with this name already exists' });
      }
    }

    // Prepare update data
    const updateData = {
      name: name ? name.trim() : existingType.name,
      sortOrder: sortOrder ? parseInt(sortOrder) : existingType.sortOrder,
      status: status !== undefined ? (status === 'true' || status === true) : existingType.status,
      description: description || existingType.description
    };

    // Handle image update
    if (req.file) {
      updateData.iconimg = req.file.filename;
      
      // Delete old image
      if (existingType.iconimg) {
        const oldImagePath = path.join(__dirname, '..', 'uploads', 'types', existingType.iconimg);
        fs.unlink(oldImagePath, (err) => {
          if (err) console.error('Error deleting old image:', err);
        });
      }
    }

    const updatedType = await Type.findByIdAndUpdate(id, updateData, { 
      new: true,
      runValidators: true 
    });

    res.status(200).json({
      message: 'Type updated successfully',
      data: updatedType
    });
  } catch (error) {
    console.error('Error updating type:', error);
    res.status(500).json({ message: 'Server error while updating type' });
  }
});

// ✅ DELETE TYPE
router.delete('/types_delete/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const type = await Type.findById(id);
    if (!type) {
      return res.status(404).json({ message: 'Type not found' });
    }

    // Delete associated image
    if (type.iconimg) {
      const imagePath = path.join(__dirname, '..', 'uploads', 'types', type.iconimg);
      fs.unlink(imagePath, (err) => {
        if (err) console.error('Error deleting image file:', err);
      });
    }

    await Type.findByIdAndDelete(id);

    res.status(200).json({ 
      message: 'Type deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting type:', error);
    res.status(500).json({ message: 'Server error while deleting type' });
  }
});

// ✅ TOGGLE STATUS
router.patch('/types_toggle/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const type = await Type.findById(id);
    if (!type) {
      return res.status(404).json({ message: 'Type not found' });
    }

    // Toggle status
    type.status = !type.status;
    await type.save();

    res.status(200).json({
      message: `Type ${type.status ? 'activated' : 'deactivated'} successfully`,
      data: type
    });
  } catch (error) {
    console.error('Error toggling type status:', error);
    res.status(500).json({ message: 'Server error while toggling status' });
  }
});

module.exports = router;