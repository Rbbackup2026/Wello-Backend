const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const KeyFeature = require('../Models/KeyFeatures'); // Mongoose model

const router = express.Router();

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `keyimg-${Date.now()}-${Math.floor(Math.random() * 1e6)}${ext}`;
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
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed!'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max size
  fileFilter,
});

// POST route to create a new KeyFeature with Multer error handling middleware
router.post('/key_feature', (req, res, next) => {
  upload.single('keyimg')(req, res, function (err) {
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
    const { name, status, info } = req.body;

    if (!name || typeof status === 'undefined') {
      return res.status(400).json({ message: 'Name and status are required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Image file (keyimg) is required.' });
    }

    // Get last sortOrder and increment it
    const lastFeature = await KeyFeature.findOne().sort({ sortOrder: -1 }).limit(1);
    const newSortOrder = lastFeature ? lastFeature.sortOrder + 1 : 1;

    const newFeature = await KeyFeature.create({
      name,
      sortOrder: newSortOrder,
      status: status === 'true' || status === true,
      keyimg: req.file.path,  // Save the file path
      info: info || "",        // Save info, default to empty string if not provided
    });

    res.status(201).json({
      message: 'Key Feature created successfully',
      data: newFeature,
    });
  } catch (err) {
    console.error('Error creating Key Feature:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET route to fetch all KeyFeatures
router.get('/key_feature_get', async (req, res) => {
  try {
    const keyFeatures = await KeyFeature.find().sort({ sortOrder: 1 });
    res.status(200).json(keyFeatures);
  } catch (err) {
    console.error('Error fetching Key Features:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});
// PUT route to update a KeyFeature
router.put('/key_feature_put/:id', upload.single('keyimg'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status, info } = req.body;

    if (!name || typeof status === 'undefined') {
      return res.status(400).json({ message: 'Name and status are required' });
    }

    const updateData = {
      name,
      status: status === 'true' || status === true,
      info: info || "",
    };

    if (req.file) {
      updateData.keyimg = req.file.path; // Update the image path if a new file is uploaded
    }

    const updatedFeature = await KeyFeature.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedFeature) {
      return res.status(404).json({ message: 'Key Feature not found' });
    }

    res.status(200).json({
      message: 'Key Feature updated successfully',
      data: updatedFeature,
    });
  } catch (err) {
    console.error('Error updating Key Feature:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE route to delete a KeyFeature
router.delete('/key_feature_delete/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedFeature = await KeyFeature.findByIdAndDelete(id);

    if (!deletedFeature) {
      return res.status(404).json({ message: 'Key Feature not found' });
    }

    // Optionally, delete the image file from the server
    if (deletedFeature.keyimg) {
      fs.unlink(deletedFeature.keyimg, (err) => {
        if (err) console.error('Error deleting image file:', err);
      });
    }

    res.status(200).json({
      message: 'Key Feature deleted successfully',
      data: deletedFeature,
    });
  } catch (err) {
    console.error('Error deleting Key Feature:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET route to fetch a single KeyFeature by ID
router.get('/key_feature_get/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const keyFeature = await KeyFeature.findById(id);
    if (!keyFeature) {
      return res.status(404).json({ message: 'Key Feature not found' });
    }
    res.status(200).json(keyFeature);
  } catch (err) {
    console.error('Error fetching Key Feature:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}
);




module.exports = router;
