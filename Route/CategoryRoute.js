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
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) cb(null, true);
  else cb(new Error("Only image files are allowed!"), false);
};

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter,
});

// CREATE CATEGORY
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

      // Fetch the highest sortOrder in the database
      const lastCategory = await Category.findOne()
        .sort({ sortOrder: -1 })
        .limit(1);
      const newSortOrder = lastCategory ? lastCategory.sortOrder + 1 : 1; // Increment the last sortOrder, or start at 1 if no categories exist

      const newCategory = {
        name,
        department,
        iconimg: req.files.iconimg[0].filename,
bannerimg: req.files.bannerimg[0].filename,

        sortOrder: newSortOrder, // Set the new sortOrder
        showInHome: showInHome === "true",
        showHomeBanner: showHomeBanner === "true",
        status: status === "true",
        pageDescription,
      };

      const category = await Category.create(newCategory);
      res
        .status(201)
        .json({ message: "Category created successfully", category });
    } catch (error) {
      console.error("Create error:", error);
      res
        .status(500)
        .json({ msg: "Failed to create category", error: error.message });
    }
  }
);

// GET ALL CATEGORIES
router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1 });
    res.status(200).json(categories);
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Error fetching categories", error: error.message });
  }
});

// GET CATEGORY BY ID
router.get("/category/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });
    res.status(200).json(category);
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Error fetching category", error: error.message });
  }
});

// UPDATE CATEGORY
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

      // Delete old images if new ones are uploaded
      if (req.files.iconimg) {
        if (fs.existsSync(category.iconimg)) fs.unlinkSync(category.iconimg);
        category.iconimg = req.files.iconimg[0].path;
      }

      if (req.files.bannerimg) {
        if (fs.existsSync(category.bannerimg))
          fs.unlinkSync(category.bannerimg);
        category.bannerimg = req.files.bannerimg[0].path;
      }

      // Update other fields
      category.name = name || category.name;
      category.department = department || category.department;
      category.sortOrder = sortOrder || category.sortOrder;
      category.showInHome = showInHome === "true";
      category.showHomeBanner = showHomeBanner === "true";
      category.status = status === "true";
      category.pageDescription = pageDescription || category.pageDescription;

      await category.save();
      res
        .status(200)
        .json({ message: "Category updated successfully", category });
    } catch (error) {
      console.error("Update error:", error);
      res
        .status(500)
        .json({ msg: "Failed to update category", error: error.message });
    }
  }
);

// DELETE CATEGORY
router.delete("/delete/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    // Delete associated images
    if (fs.existsSync(category.iconimg)) fs.unlinkSync(category.iconimg);
    if (fs.existsSync(category.bannerimg)) fs.unlinkSync(category.bannerimg);

    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res
      .status(500)
      .json({ msg: "Failed to delete category", error: error.message });
  }
});

// ERROR HANDLING MIDDLEWARE
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});

module.exports = router;
