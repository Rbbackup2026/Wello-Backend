// routes/bannerRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Banner = require("../Models/Carousel");

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); 
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = file.fieldname + "-" + Date.now() + ext;
    cb(null, name);
  }
});
const upload = multer({ storage });

// GET all banners (optionally filter, sort)
router.get("/getbanner", async (req, res) => {
  try {
    const banners = await Banner.find().sort({ sortOrder: 1 });
    console.log("Banners fetched:", banners); 
    res.json(banners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// POST new banner
router.post("/banner", upload.single("image"), async (req, res) => {
  try {
    const { title, desc, isActive, sortOrder } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: "Image required" });
    }
    const image = `/uploads/${req.file.filename}`;
    const banner = new Banner({
      title,
      desc,
      image,
      isActive: isActive === "true" || isActive === true,
      sortOrder: sortOrder ? parseInt(sortOrder) : 0
    });
    await banner.save();
    res.status(201).json(banner);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT: Update banner data (title, desc, isActive, sortOrder) (without changing image)
router.put("/banner/:id", async (req, res) => {
  try {
    const { title, desc, isActive, sortOrder } = req.body;
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: "Not found" });

    banner.title = title !== undefined ? title : banner.title;
    banner.desc = desc !== undefined ? desc : banner.desc;
    banner.isActive = isActive !== undefined ? isActive : banner.isActive;
    banner.sortOrder = sortOrder !== undefined ? parseInt(sortOrder) : banner.sortOrder;

    await banner.save();
    res.json(banner);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT: Update image
router.put("/banner/:id/image", upload.single("image"), async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: "Not found" });
    if (!req.file) return res.status(400).json({ message: "Image required" });

    banner.image = `/uploads/${req.file.filename}`;
    await banner.save();
    res.json(banner);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE banner
router.delete("/banner/:id", async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted", banner });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
