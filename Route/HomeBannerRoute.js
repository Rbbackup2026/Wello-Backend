// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// const Banner = require('../Models/HomeBanner'); // Mongoose model

// // Multer storage config
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/Homebanners');
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, uniqueSuffix + path.extname(file.originalname));
//   },
// });

// const upload = multer({ storage });


// // ✅ POST: Upload new banner
// router.post('/uploadhomebanner', upload.single('image'), async (req, res) => {
//   try {
//     if (!req.file) return res.status(400).json({ error: 'Image file is required' });

//     const banner = new Banner({
//       image: `/uploads/Homebanners/${req.file.filename}`,
//       isActive: req.body.isActive ?? true, // optionally take isActive from body
//     });

//     await banner.save();
//     res.status(201).json({ message: 'Banner uploaded successfully', banner });
//   } catch (err) {
//     res.status(500).json({ error: 'Upload failed', details: err.message });
//   }
// });


// // ✅ GET: Only active banners
// router.get('/getall', async (req, res) => {
//   try {
//     const banners = await Banner.find({ isActive: true }).sort({ createdAt: -1 });
//     res.status(200).json(banners);
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to fetch banners' });
//   }
// });


// // ✅ GET: Single banner by ID
// router.get('/getone/:id', async (req, res) => {
//   try {
//     const banner = await Banner.findById(req.params.id);
//     if (!banner) return res.status(404).json({ error: 'Banner not found' });

//     res.status(200).json(banner);
//   } catch (err) {
//     res.status(500).json({ error: 'Error retrieving banner' });
//   }
// });


// // ✅ PUT: Update banner image and isActive
// router.put('/put/:id', upload.single('image'), async (req, res) => {
//   try {
//     const banner = await Banner.findById(req.params.id);
//     if (!banner) return res.status(404).json({ error: 'Banner not found' });

//     // Replace image if uploaded
//     if (req.file) {
//       const oldImagePath = path.join(__dirname, '..', banner.image);
//       if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
//       banner.image = `/uploads/Homebanners/${req.file.filename}`;
//     }

//     // Update isActive if provided
//     if (req.body.isActive !== undefined) {
//       banner.isActive = req.body.isActive === 'true' || req.body.isActive === true;
//     }

//     await banner.save();
//     res.status(200).json({ message: 'Banner updated successfully', banner });
//   } catch (err) {
//     res.status(500).json({ error: 'Update failed', details: err.message });
//   }
// });


// router.delete('/delete/:id', async (req, res) => {
//   try {
//     const banner = await Banner.findById(req.params.id);
//     if (!banner) return res.status(404).json({ error: 'Banner not found' });

//     const imagePath = path.join(__dirname, '..', banner.image);
//     if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

//     await banner.deleteOne();
//     res.status(200).json({ message: 'Banner deleted successfully' });
//   } catch (err) {
//     res.status(500).json({ error: 'Delete failed', details: err.message });
//   }
// });

// module.exports = router;





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
  },
});

const upload = multer({ storage });

// ✅ POST: Upload new banner (webImage + appImage)
router.post(
  '/uploadhomebanner',
  upload.fields([
    { name: 'webImage', maxCount: 1 },
    { name: 'appImage', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      if (!req.files?.webImage || !req.files?.appImage) {
        return res.status(400).json({ error: 'Both webImage and appImage are required' });
      }

      const banner = new Banner({
        display: req.body.display,
        city: req.body.city || '',
        link: req.body.link || '',
        sortId: parseInt(req.body.sortId) || 0,
        status: req.body.status || 'Active',
        webImage: `/uploads/Homebanners/${req.files.webImage[0].filename}`,
        appImage: `/uploads/Homebanners/${req.files.appImage[0].filename}`,
      });

      await banner.save();
      res.status(201).json({ message: 'Banner uploaded successfully', banner });
    } catch (err) {
      res.status(500).json({ error: 'Upload failed', details: err.message });
    }
  }
);

// ✅ GET: All banners (optionally filter by active)
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

// ✅ PUT: Update banner details and optionally images
router.put(
  '/put/:id',
  upload.fields([
    { name: 'webImage', maxCount: 1 },
    { name: 'appImage', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const banner = await Banner.findById(req.params.id);
      if (!banner) return res.status(404).json({ error: 'Banner not found' });

      if (req.body.display) banner.display = req.body.display;
      if (req.body.city !== undefined) banner.city = req.body.city;
      if (req.body.link !== undefined) banner.link = req.body.link;
      if (req.body.sortId !== undefined) banner.sortId = parseInt(req.body.sortId);
      if (req.body.status !== undefined) banner.status = req.body.status;

      if (req.files?.webImage) {
        const oldWebImagePath = path.join(__dirname, '..', banner.webImage);
        if (fs.existsSync(oldWebImagePath)) fs.unlinkSync(oldWebImagePath);
        banner.webImage = `/uploads/Homebanners/${req.files.webImage[0].filename}`;
      }

      if (req.files?.appImage) {
        const oldAppImagePath = path.join(__dirname, '..', banner.appImage);
        if (fs.existsSync(oldAppImagePath)) fs.unlinkSync(oldAppImagePath);
        banner.appImage = `/uploads/Homebanners/${req.files.appImage[0].filename}`;
      }

      await banner.save();
      res.status(200).json({ message: 'Banner updated successfully', banner });
    } catch (err) {
      res.status(500).json({ error: 'Update failed', details: err.message });
    }
  }
);

// ✅ DELETE: Delete banner and remove images
router.delete('/delete/:id', async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ error: 'Banner not found' });

    const webImagePath = path.join(__dirname, '..', banner.webImage);
    const appImagePath = path.join(__dirname, '..', banner.appImage);
    if (fs.existsSync(webImagePath)) fs.unlinkSync(webImagePath);
    if (fs.existsSync(appImagePath)) fs.unlinkSync(appImagePath);

    await banner.deleteOne();
    res.status(200).json({ message: 'Banner deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed', details: err.message });
  }
});

module.exports = router;

