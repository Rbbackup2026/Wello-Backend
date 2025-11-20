


const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const Category = require("../Models/Category");

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) cb(null, true);
  else cb(new Error("Only image files are allowed!"), false);
};

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter,
});

// ✅ CREATE CATEGORY
router.post(
  "/create-category",
  upload.fields([
    { name: "iconimg", maxCount: 1 },
    { name: "bannerimg", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        name,
        department,
        showInHome,
        showHomeBanner,
        status,
        pageDescription,
      } = req.body;

      if (!name || !department || !req.files.iconimg || !req.files.bannerimg) {
        return res
          .status(400)
          .json({ message: "All fields are required, including file uploads" });
      }

      const lastCategory = await Category.findOne()
        .sort({ sortOrder: -1 })
        .limit(1);
      const newSortOrder = lastCategory ? lastCategory.sortOrder + 1 : 1;

      const newCategory = {
        name,
        department,
        iconimg: `/uploads/${req.files.iconimg[0].filename}`,
        bannerimg: `/uploads/${req.files.bannerimg[0].filename}`,
        sortOrder: newSortOrder,
        showInHome: showInHome === "true",
        showHomeBanner: showHomeBanner === "true",
        status: status === "true",
        pageDescription,
      };

      const category = await Category.create(newCategory);
      res.status(201).json({ message: "Category created successfully", category });
    } catch (error) {
      console.error("Create error:", error);
      res.status(500).json({ msg: "Failed to create category", error: error.message });
    }
  }
);

// ✅ GET ALL CATEGORIES
router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ msg: "Error fetching categories", error: error.message });
  }
});

// ✅ GET CATEGORY BY ID
router.get("/category/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ msg: "Error fetching category", error: error.message });
  }
});

// ✅ UPDATE CATEGORY
router.put(
  "/put/:id",
  upload.fields([
    { name: "iconimg", maxCount: 1 },
    { name: "bannerimg", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      if (!category)
        return res.status(404).json({ message: "Category not found" });

      const {
        name,
        department,
        sortOrder,
        showInHome,
        showHomeBanner,
        status,
        pageDescription,
      } = req.body;

      // Delete and update icon image
      if (req.files.iconimg) {
        const oldIconPath = path.join(__dirname, "..", category.iconimg);
        if (fs.existsSync(oldIconPath)) fs.unlinkSync(oldIconPath);
        category.iconimg = `/uploads/${req.files.iconimg[0].filename}`;
      }

      // Delete and update banner image
      if (req.files.bannerimg) {
        const oldBannerPath = path.join(__dirname, "..", category.bannerimg);
        if (fs.existsSync(oldBannerPath)) fs.unlinkSync(oldBannerPath);
        category.bannerimg = `/uploads/${req.files.bannerimg[0].filename}`;
      }

      // Update other fields
      if (name !== undefined) category.name = name;
      if (department !== undefined) category.department = department;
      if (sortOrder !== undefined) category.sortOrder = parseInt(sortOrder);
      if (showInHome !== undefined) category.showInHome = showInHome === "true";
      if (showHomeBanner !== undefined) category.showHomeBanner = showHomeBanner === "true";
      if (status !== undefined) category.status = status === "true";
      if (pageDescription !== undefined) category.pageDescription = pageDescription;

      await category.save();
      res.status(200).json({ message: "Category updated successfully", category });
    } catch (error) {
      console.error("Update error:", error);
      res.status(500).json({ msg: "Failed to update category", error: error.message });
    }
  }
);

// ✅ DELETE CATEGORY
router.delete("/delete/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    const iconPath = path.join(__dirname, "..", category.iconimg);
    const bannerPath = path.join(__dirname, "..", category.bannerimg);

    if (fs.existsSync(iconPath)) fs.unlinkSync(iconPath);
    if (fs.existsSync(bannerPath)) fs.unlinkSync(bannerPath);

    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ msg: "Failed to delete category", error: error.message });
  }
});

// ✅ ERROR HANDLING MIDDLEWARE
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});

// Toggle status route
router.put("/toggle-status/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    category.status = !category.status; // flip status
    await category.save();

    res.status(200).json({ message: "Status toggled successfully", category });
  } catch (error) {
    console.error("Toggle status error:", error);
    res.status(500).json({ message: "Failed to toggle status", error: error.message });
  }
});


module.exports = router;
