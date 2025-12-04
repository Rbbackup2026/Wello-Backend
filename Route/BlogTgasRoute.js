const express = require("express");
const router = express.Router();
const BlogTag = require("../Models/BlogTags");

// ====================== BLOG TAGS CRUD ======================

// CREATE TAG
router.post("/blogtagpost", async (req, res) => {
  try {
    const tag = new BlogTag({
      name: req.body.name,
      sortOrder: req.body.sortOrder,
      mostUsed: req.body.mostUsed,
      status: req.body.status,
    });

    await tag.save();
    res.status(201).json({ success: true, data: tag });
  } catch (err) {
    console.error("TAG POST ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET ALL TAGS
router.get("/tagget", async (req, res) => {
  try {
    const tags = await BlogTag.find().sort({ sortOrder: 1 });
    res.json({ success: true, data: tags });
  } catch (err) {
    console.error("TAG GET ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET TAG BY ID
router.get("/taggetid/:id", async (req, res) => {
  try {
    const tag = await BlogTag.findById(req.params.id);
    if (!tag)
      return res.status(404).json({ success: false, message: "Not Found" });

    res.json({ success: true, data: tag });
  } catch (err) {
    console.error("TAG ID ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// UPDATE TAG
router.put("/tagput/:id", async (req, res) => {
  try {
    const tag = await BlogTag.findById(req.params.id);
    if (!tag)
      return res.status(404).json({ success: false, message: "Not Found" });

    tag.name = req.body.name;
    tag.sortOrder = req.body.sortOrder;
    tag.mostUsed = req.body.mostUsed;
    tag.status = req.body.status;

    await tag.save();
    res.json({ success: true, data: tag });
  } catch (err) {
    console.error("TAG UPDATE ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// DELETE TAG
router.delete("/tagdelete/:id", async (req, res) => {
  try {
    const tag = await BlogTag.findById(req.params.id);
    if (!tag)
      return res.status(404).json({ success: false, message: "Not Found" });

    await tag.deleteOne();
    res.json({ success: true, message: "Tag Deleted" });
  } catch (err) {
    console.error("TAG DELETE ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// TOGGLE STATUS
// TOGGLE STATUS
router.put("/tagtoggle-status/:id", async (req, res) => {
  try {
    const tag = await BlogTag.findById(req.params.id);

    if (!tag)
      return res.status(404).json({ success: false, message: "Not Found" });

    // Correct Toggle Logic (Active <-> Inactive)
    tag.status = tag.status === "Active" ? "Inactive" : "Active";
    await tag.save();

    res.json({
      success: true,
      message: "Status Updated",
      data: tag,   // send updated tag
    });

  } catch (err) {
    console.error("TAG STATUS ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


module.exports = router;
