const express = require('express');
const router = express.Router();
const Product = require('../Models/ListingItems');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ✅ Multer configuration for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `product-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// ✅ POST product - MATCHING FRONTEND FIELDS
router.post('/post_product', upload.single('iconImg'), async (req, res) => {
  try {
    const productData = { ...req.body };
    
    console.log('Received data:', productData);
    console.log('File received:', req.file);

    // ✅ Handle array fields - MATCHING FRONTEND FIELD NAMES
    const arrayFields = ['keyFeatures', 'department'];
    arrayFields.forEach(field => {
      if (productData[field]) {
        try {
          productData[field] = typeof productData[field] === 'string' 
            ? JSON.parse(productData[field]) 
            : productData[field];
        } catch (e) {
          console.error(`Error parsing ${field}:`, e);
          productData[field] = [];
        }
      }
    });

    // ✅ Handle numeric conversions - MATCHING FRONTEND FIELD NAMES
    const numericFields = [
      'price', 'mrp', 'schedulePrice', 'testCount', 'fromAge', 'toAge'
    ];
    numericFields.forEach(field => {
      if (productData[field] !== undefined && productData[field] !== '') {
        productData[field] = Number(productData[field]);
        if (isNaN(productData[field])) {
          productData[field] = field === 'testCount' ? 1 : 0;
        }
      }
    });

    // ✅ Handle boolean fields - MATCHING FRONTEND FIELD NAMES
    const booleanFields = ['showInHome', 'showHomeBanner', 'status'];
    booleanFields.forEach(field => {
      if (productData[field] !== undefined) {
        productData[field] = productData[field] === 'true' || productData[field] === true || productData[field] === '1';
      }
    });

    // ✅ Handle image - MATCHING FRONTEND FIELD NAME 'iconImg'
    if (req.file) {
      productData.iconImg = req.file.filename; // ✅ Store filename directly as frontend expects
    }

    // ✅ Set default values for required fields
    if (!productData.metaTitle && productData.name) {
      productData.metaTitle = productData.name;
    }
    if (!productData.metaKeywords && productData.name) {
      productData.metaKeywords = productData.name;
    }
    if (!productData.metaDescription && productData.name) {
      productData.metaDescription = productData.name;
    }

    // ✅ Ensure city is required as per frontend validation
    if (!productData.city) {
      return res.status(400).json({
        success: false,
        message: 'City is required'
      });
    }

    const product = new Product(productData);
    await product.save();

    // ✅ Populate references - MATCHING FRONTEND FIELD NAMES
    const populatedProduct = await Product.findById(product._id)
      .populate('category')
      .populate('department')
      .populate('keyFeatures')
      .populate('diseases')
      .populate('certificate')
      .populate('lab');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: populatedProduct
    });

  } catch (error) {
    console.error('Error creating product:', error);
    
    // Delete uploaded file if there was an error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });
    }

    res.status(400).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ✅ UPDATE product route - MATCHING FRONTEND FIELDS
router.put('/items/:id', upload.single('iconImg'), async (req, res) => {
  try {
    const { id } = req.params;
    const productData = { ...req.body };

    console.log('Updating product ID:', id);
    console.log('Update data:', productData);

    // ✅ Check if product exists
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    // ✅ Handle array fields - MATCHING FRONTEND FIELD NAMES
    const arrayFields = ['keyFeatures', 'department'];
    arrayFields.forEach(field => {
      if (productData[field]) {
        try {
          productData[field] = typeof productData[field] === 'string' 
            ? JSON.parse(productData[field]) 
            : productData[field];
        } catch (e) {
          console.error(`Error parsing ${field}:`, e);
          productData[field] = existingProduct[field];
        }
      }
    });

    // ✅ Handle numeric conversions - MATCHING FRONTEND FIELD NAMES
    const numericFields = [
      'price', 'mrp', 'schedulePrice', 'testCount', 'fromAge', 'toAge'
    ];
    numericFields.forEach(field => {
      if (productData[field] !== undefined && productData[field] !== '') {
        productData[field] = Number(productData[field]);
        if (isNaN(productData[field])) {
          productData[field] = existingProduct[field] || (field === 'testCount' ? 1 : 0);
        }
      }
    });

    // ✅ Handle boolean fields - MATCHING FRONTEND FIELD NAMES
    const booleanFields = ['showInHome', 'showHomeBanner', 'status'];
    booleanFields.forEach(field => {
      if (productData[field] !== undefined) {
        productData[field] = productData[field] === 'true' || productData[field] === true || productData[field] === '1';
      }
    });

    // ✅ Handle image update - MATCHING FRONTEND FIELD NAME 'iconImg'
    if (req.file) {
      // Delete old image if it exists
      if (existingProduct.iconImg) {
        const oldImagePath = path.join(__dirname, '..', 'uploads', existingProduct.iconImg);
        if (fs.existsSync(oldImagePath)) {
          fs.unlink(oldImagePath, (err) => {
            if (err) console.error('Error deleting old image:', err);
          });
        }
      }
      
      productData.iconImg = req.file.filename; // ✅ Store filename directly
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      productData,
      { new: true, runValidators: true }
    ).populate(['category', 'department', 'keyFeatures', 'diseases', 'certificate', 'lab']);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });

  } catch (error) {
    console.error('Error updating product:', error);
    
    // Delete uploaded file if there was an error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });
    }

    res.status(400).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ✅ GET all products with population
router.get('/get_product', async (req, res) => {
  try {
    const products = await Product.find()
      .populate('category')
      .populate('department')
      .populate('keyFeatures')
      .populate('diseases')
      .populate('certificate')
      .populate('lab')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching products',
      error: error.message 
    });
  }
});

// ✅ GET single product
router.get('/get_product/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid product ID format' 
      });
    }

    const product = await Product.findById(id)
      .populate('category')
      .populate('department')
      .populate('keyFeatures')
      .populate('diseases')
      .populate('certificate')
      .populate('lab');

    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching product',
      error: error.message 
    });
  }
});

// ✅ UPDATE status only
router.put('/put_status/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid product ID format' 
      });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { isActive: isActive, status: isActive },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    res.json({
      success: true,
      message: `Product ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: product
    });
  } catch (error) {
    console.error('Error toggling status:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// ✅ DELETE product
router.delete('/delete_product/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid product ID format' 
      });
    }

    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    // Delete associated image
    if (product.iconImg) {
      const imagePath = path.join(__dirname, '..', 'uploads', product.iconImg);
      if (fs.existsSync(imagePath)) {
        fs.unlink(imagePath, (err) => {
          if (err) console.error('Error deleting product image:', err);
        });
      }
    }

    await Product.findByIdAndDelete(id);

    res.json({ 
      success: true,
      message: 'Product deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting product',
      error: error.message 
    });
  }
});

module.exports = router;