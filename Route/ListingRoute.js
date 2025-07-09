const express = require('express');
const multer = require('multer');
const path = require('path');
const Product = require('../Models/ListingItems');
const router = express.Router();

// Configure Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// POST /product_upload
router.post('/product_upload', upload.array('images', 7), async (req, res) => {
  try {
    const imageUrls = req.files.map(file => ({
      url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
    }));

    const {
      name, description, category,
      price, discountPrice, stockQuantity,
      sku, brand, ratingsAverage, ratingsCount, isActive
    } = req.body;

    const newProduct = new Product({
      name,
      description,
      category,
      price,
      discountPrice,
      stockQuantity,
      sku,
      brand,
      ratingsAverage,
      ratingsCount,
      isActive,
      images: imageUrls
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);

  } catch (error) {
    console.error('Error saving product:', error);
    res.status(400).json({ message: error.message });
  }
});


router.get("/get_product", async (req, res) => {
  try {
    const items = await Product.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get('/product/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).send({ error: "Product not found" });
  res.send(product);
});



// You're returning a SINGLE product if it exists and isActive
router.get('/getproduct_id/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isActive: true });
    if (!product) return res.status(404).json({ message: 'Product not found or inactive.' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

/**
 * PUT /items/:id - Update product
 */
router.put("/put_product/:id", async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ message: "Item not found" });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * PUT /items/:id/toggle-status - Toggle isActive
 */
router.put("/put_status/:id/toggle-status", async (req, res) => {
  try {
    const item = await Product.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    item.isActive = !item.isActive;
    await item.save();
    res.json({ message: "Status toggled", isActive: item.isActive });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * DELETE /items/:id - Delete product
 */
router.delete("/delete_product/:id", async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Item deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
