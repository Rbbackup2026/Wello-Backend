const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Banner = require('../Models/HomeBanner'); // Mongoose model

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/Homebanners');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });


// ✅ POST: Upload new banner
router.post('/uploadhomebanner', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image file is required' });

    const banner = new Banner({
      image: `/uploads/Homebanners/${req.file.filename}`
    });

    await banner.save();
    res.status(201).json({ message: 'Banner uploaded successfully', banner });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});


// ✅ GET: All banners
router.get('/getall', async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    res.status(200).json(banners);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch banners' });
  }
});

// ✅ GET: Single banner by ID
router.get('/getone/:id', async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ error: 'Banner not found' });

    res.status(200).json(banner);
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving banner' });
  }
});


// ✅ PUT: Update banner (optionally update image)
router.put('/put/:id', upload.single('image'), async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ error: 'Banner not found' });

    // If a new image is uploaded, delete old one
    if (req.file) {
      const oldImagePath = path.join(__dirname, '..', banner.image);
      if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);

      banner.image = `/uploads/Homebanners/${req.file.filename}`;
    }

    await banner.save();
    res.status(200).json({ message: 'Banner updated successfully', banner });
  } catch (err) {
    res.status(500).json({ error: 'Update failed', details: err.message });
  }
});


// ✅ DELETE: Delete banner and image file
router.delete('/delete/:id', async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ error: 'Banner not found' });

    // Delete image file
    const imagePath = path.join(__dirname, '..', banner.image);
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

    await banner.deleteOne();
    res.status(200).json({ message: 'Banner deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed', details: err.message });
  }
});

module.exports = router;
