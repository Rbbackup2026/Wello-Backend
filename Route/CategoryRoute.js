const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const Category = require("../Models/Category");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

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
  params: async (req, file) => {
    return {
      folder: "categories", // Cloudinary mein "categories" folder
      allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
      transformation: [{ width: 800, height: 800, crop: "limit" }],
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) cb(null, true);
    else cb(new Error("Only image files are allowed!"), false);
  },
});

const parseFaqs = (faqs, fallback = []) => {
  if (faqs === undefined) return fallback;
  if (Array.isArray(faqs)) return faqs;
  if (!String(faqs).trim()) return [];

  try {
    const parsedFaqs = JSON.parse(faqs);
    return Array.isArray(parsedFaqs) ? parsedFaqs : [];
  } catch (error) {
    return fallback;
  }
};

// =============================================
// Helper: Cloudinary se image delete karo
// =============================================
const deleteFromCloudinary = async (imageUrl) => {
  if (!imageUrl) return;
  try {
    // URL se public_id nikalo
    // Format: https://res.cloudinary.com/cloud/image/upload/v123/categories/filename.jpg
    const urlParts = imageUrl.split("/");
    const fileName = urlParts[urlParts.length - 1].split(".")[0];
    const folderIndex = urlParts.indexOf("categories");
    if (folderIndex !== -1) {
      const publicId = `categories/${fileName}`;
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (err) {
    console.error("Cloudinary delete error:", err);
  }
};

// =============================================
// CREATE CATEGORY
// =============================================
router.post(
  "/create-category",
  upload.fields([
    { name: "iconimg", maxCount: 1 },
    { name: "bannerimg", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { name, department, showInHome, showHomeBanner, showInNavbar, status, pageDescription, faqs } = req.body;

      if (!name || !department || !req.files?.iconimg || !req.files?.bannerimg) {
        // Agar koi file upload ho gayi thi to delete karo
        if (req.files?.iconimg) await deleteFromCloudinary(req.files.iconimg[0].path);
        if (req.files?.bannerimg) await deleteFromCloudinary(req.files.bannerimg[0].path);
        return res.status(400).json({ message: "All fields are required, including file uploads" });
      }

      const lastCategory = await Category.findOne().sort({ sortOrder: -1 }).limit(1);
      const newSortOrder = lastCategory ? lastCategory.sortOrder + 1 : 1;

      const newCategory = {
        name,
        department,
        // ✅ Cloudinary URL directly save hoga (req.files.iconimg[0].path = Cloudinary URL)
        iconimg: req.files.iconimg[0].path,
        bannerimg: req.files.bannerimg[0].path,
        sortOrder: newSortOrder,
        showinhome: showInHome === "true",
        showinNavbar: showInNavbar === "true",
        showhomebanner: showHomeBanner === "true",
        status: status === "true",
        pagedescription: pageDescription,
        faqs: parseFaqs(faqs),
      };

      const category = await Category.create(newCategory);
      res.status(201).json({ message: "Category created successfully", category });
    } catch (error) {
      console.error("Create error:", error);
      res.status(500).json({ msg: "Failed to create category", error: error.message });
    }
  }
);

// =============================================
// GET ALL CATEGORIES
// =============================================
router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ msg: "Error fetching categories", error: error.message });
  }
});

// =============================================
// GET CATEGORY BY ID
// =============================================
router.get("/category/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ msg: "Error fetching category", error: error.message });
  }
});

// =============================================
// UPDATE CATEGORY
// =============================================
router.put(
  "/put/:id",
  upload.fields([
    { name: "iconimg", maxCount: 1 },
    { name: "bannerimg", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) return res.status(404).json({ message: "Category not found" });

      const { name, department, sortOrder, showInHome, showHomeBanner, showInNavbar, status, pageDescription, faqs } = req.body;

      // ✅ Nai icon image aayi to purani Cloudinary se delete karo
      if (req.files?.iconimg) {
        await deleteFromCloudinary(category.iconimg);
        category.iconimg = req.files.iconimg[0].path; // Cloudinary URL
      }

      // ✅ Nai banner image aayi to purani Cloudinary se delete karo
      if (req.files?.bannerimg) {
        await deleteFromCloudinary(category.bannerimg);
        category.bannerimg = req.files.bannerimg[0].path; // Cloudinary URL
      }

      if (name !== undefined) category.name = name;
      if (department !== undefined) category.department = department;
      if (sortOrder !== undefined) category.sortOrder = parseInt(sortOrder);
      if (showInHome !== undefined) category.showinhome = showInHome === "true";
      if (showInNavbar !== undefined) category.showinNavbar = showInNavbar === "true";
      if (showHomeBanner !== undefined) category.showhomebanner = showHomeBanner === "true";
      if (status !== undefined) category.status = status === "true";
      if (pageDescription !== undefined) category.pagedescription = pageDescription;
      if (faqs !== undefined) category.faqs = parseFaqs(faqs, category.faqs);

      await category.save();
      res.status(200).json({ message: "Category updated successfully", category });
    } catch (error) {
      console.error("Update error:", error);
      res.status(500).json({ msg: "Failed to update category", error: error.message });
    }
  }
);

// =============================================
// DELETE CATEGORY
// =============================================
router.delete("/delete/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    // ✅ Cloudinary se dono images delete karo
    await deleteFromCloudinary(category.iconimg);
    await deleteFromCloudinary(category.bannerimg);

    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ msg: "Failed to delete category", error: error.message });
  }
});

// =============================================
// TOGGLE SHOW IN HOME
// =============================================
router.put("/toggle-showInHome/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    category.showinhome = !category.showinhome;
    await category.save();

    res.status(200).json({ message: "Home visibility toggled successfully", category });
  } catch (error) {
    res.status(500).json({ message: "Failed to toggle home visibility", error: error.message });
  }
});

// =============================================
// TOGGLE SHOW IN NAVBAR
// =============================================
router.put("/toggle-showInNavbar/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    category.showinNavbar = !category.showinNavbar;
    await category.save();

    res.status(200).json({ message: "Navbar visibility toggled successfully", category });
  } catch (error) {
    res.status(500).json({ message: "Failed to toggle navbar visibility", error: error.message });
  }
});

// =============================================
// TOGGLE SHOW HOME BANNER
// =============================================
router.put("/toggle-showHomeBanner/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    category.showhomebanner = !category.showhomebanner;
    await category.save();

    res.status(200).json({ message: "Home banner visibility toggled successfully", category });
  } catch (error) {
    res.status(500).json({ message: "Failed to toggle banner visibility", error: error.message });
  }
});

// =============================================
// TOGGLE STATUS
// =============================================
router.put("/toggle-status/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    category.status = !category.status;
    await category.save();

    res.status(200).json({ message: "Status toggled successfully", category });
  } catch (error) {
    res.status(500).json({ message: "Failed to toggle status", error: error.message });
  }
});

// =============================================
// ERROR HANDLING MIDDLEWARE
// =============================================
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});

module.exports = router;
