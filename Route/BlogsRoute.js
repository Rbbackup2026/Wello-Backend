const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Blog = require("../Models/Blog");

const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
const BASE_URL = process.env.BASE_URL || "https://razobytehealthcare-website-backend-code.onrender.com/";

// ensure upload dir exists
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, name);
  },
});
const upload = multer({ storage });


// ========== GET ALL BLOGS ==========
router.get("/blogget", async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ sortOrder: 1 });
    const result = blogs.map((b) => {
      const obj = b.toObject();
      if (obj.image) obj.image = `${BASE_URL}${obj.image}`;
      return obj;
    });

    res.json(result);
  } catch (err) {
    console.error("GET ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ========== GET BLOG BY ID ==========
router.get("/getblogid/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) return res.status(404).json({ message: "Not found" });

    const obj = blog.toObject();
    if (obj.image) obj.image = `${BASE_URL}${obj.image}`;

    res.json(obj);
  } catch (err) {
    console.error("GET ID ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ========== POST BLOG ==========
router.post("/blogpost", upload.single("image"), async (req, res) => {
  try {
    const payload = req.body;

    let imagePath = null;
    if (req.file) {
      imagePath = `/${UPLOAD_DIR}/${req.file.filename}`;
    }

    const blog = new Blog({
      name: payload.name,
      intro: payload.intro,
      description: payload.description,
      category: payload.category,
      tags: JSON.parse(payload.tags || "[]"),
      image: imagePath,
      metaTitle: payload.metaTitle,
      metaDescription: payload.metaDescription,
      sortOrder: payload.sortOrder,
      status: payload.status,
      setAtHome: payload.setAtHome === "true",
    });

    await blog.save();
    res.status(201).json(blog);
  } catch (err) {
    console.error("POST ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ========== UPDATE BLOG ==========
router.put("/blogput/:id", upload.single("image"), async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Not found" });

    const payload = req.body;

    // Replace image
    if (req.file) {
      if (blog.image) {
        const oldPath = path.join(process.cwd(), blog.image.replace("/", ""));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      blog.image = `/${UPLOAD_DIR}/${req.file.filename}`;
    }

    blog.name = payload.name;
    blog.intro = payload.intro;
    blog.description = payload.description;
    blog.category = payload.category;
    blog.tags = JSON.parse(payload.tags || "[]");
    blog.metaTitle = payload.metaTitle;
    blog.metaDescription = payload.metaDescription;
    blog.sortOrder = payload.sortOrder;
    blog.status = payload.status;
    blog.setAtHome = payload.setAtHome === "true";

    await blog.save();
    res.json(blog);
  } catch (err) {
    console.error("PUT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ========== DELETE BLOG ==========
router.delete("/blogdelete/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Not found" });

    if (blog.image) {
      const oldPath = path.join(process.cwd(), blog.image.replace("/", ""));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await blog.deleteOne();
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ========== TOGGLE STATUS ==========
router.put("/blogtoggle-status/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: "Blog Not Found" });
    }

    // Toggle status (true/false)
    blog.status = blog.status === "active" ? "inactive" : "active";

    await blog.save();

    res.json({
      message: "Status Updated",
      newStatus: blog.status,
    });

  } catch (err) {
    console.error("STATUS TOGGLE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ========== TOGGLE setAtHome ==========
router.put("/blogtoggle-home/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: "Blog Not Found" });
    }

    // Toggle setAtHome (true/false)
    blog.setAtHome = !blog.setAtHome;

    await blog.save();

    res.json({
      message: "Home Visibility Updated",
      newSetAtHome: blog.setAtHome,
    });

  } catch (err) {
    console.error("HOME TOGGLE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ========= GET ONLY ACTIVE BLOGS (For frontend home page) =========
router.get("/blogget-active", async (req, res) => {
  try {
    const blogs = await Blog.find(
      { status: "active" },              // only active
      { name: 1, intro: 1, image: 1 }    // return only required fields
    ).sort({ sortOrder: 1 });

    const result = blogs.map((b) => ({
      _id: b._id,
      name: b.name,
      intro: b.intro,
      image: b.image ? `${BASE_URL}${b.image}` : null,
    }));

    res.json(result);
  } catch (err) {
    console.error("ACTIVE BLOG GET ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/blog-categories-with-count", async (req, res) => {
  try {
    const categories = await Category.find();

    const result = await Promise.all(
      categories.map(async (cat) => {
        const blogCount = await Blog.countDocuments({ category: cat._id });
        return {
          _id: cat._id,
          name: cat.name,
          blogCount,
        };
      })
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});



module.exports = router;
