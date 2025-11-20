const express = require('express');
const router = express.Router();
const Product = require('../Models/ListingItems');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ✅ FIXED: Multer configuration with proper setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    // Create directory if it doesn't exist
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

// ✅ FIXED: POST product with better error handling
router.post('/post_product', upload.single('iconImg'), async (req, res) => {
  try {
    const productData = { ...req.body };
    
    console.log('Received data:', productData);
    console.log('File received:', req.file);

    // ✅ Handle array fields safely
    if (productData.keyFeatures) {
      try {
        productData.keyFeatures = typeof productData.keyFeatures === 'string' 
          ? JSON.parse(productData.keyFeatures) 
          : productData.keyFeatures;
      } catch (e) {
        console.error('Error parsing keyFeatures:', e);
        productData.keyFeatures = [];
      }
    }

    if (productData.department) {
      try {
        productData.department = typeof productData.department === 'string'
          ? JSON.parse(productData.department)
          : productData.department;
      } catch (e) {
        console.error('Error parsing department:', e);
        productData.department = [];
      }
    }

    // ✅ Handle numeric conversions safely
    const numericFields = ['price', 'mrp', 'schedulePrice', 'testCount', 'fromAge', 'toAge'];
    numericFields.forEach(field => {
      if (productData[field]) {
        productData[field] = Number(productData[field]);
        if (isNaN(productData[field])) {
          productData[field] = 0;
        }
      }
    });

    // ✅ Handle boolean fields
    const booleanFields = ['showInHome', 'showHomeBanner', 'status', 'isActive'];
    booleanFields.forEach(field => {
      if (productData[field] !== undefined) {
        productData[field] = productData[field] === 'true' || productData[field] === true;
      }
    });

    // ✅ Handle image
    if (req.file) {
      productData.images = [{
        url: `/uploads/${req.file.filename}`
      }];
    } else {
      productData.images = [];
    }

    // ✅ Set default values for required fields
    if (!productData.metaTitle) productData.metaTitle = productData.name;
    if (!productData.metaKeywords) productData.metaKeywords = productData.name;
    if (!productData.metaDescription) productData.metaDescription = productData.name;

    const product = new Product(productData);
    await product.save();

    // ✅ Populate references
    const populatedProduct = await Product.findById(product._id)
      .populate('category')
      .populate('department')
      .populate('keyFeatures')
      .populate('diseases');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: populatedProduct
    });

  } catch (error) {
    console.error('Error creating product:', error);
    
    // ✅ Delete uploaded file if there was an error
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

// ✅ FIXED: UPDATE product route
router.put('/put_product/:id', upload.single('iconImg'), async (req, res) => {
  try {
    const { id } = req.params;
    const productData = { ...req.body };

    // ✅ Check if product exists
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    // ✅ Handle array fields safely
    if (productData.keyFeatures) {
      try {
        productData.keyFeatures = typeof productData.keyFeatures === 'string' 
          ? JSON.parse(productData.keyFeatures) 
          : productData.keyFeatures;
      } catch (e) {
        console.error('Error parsing keyFeatures:', e);
        productData.keyFeatures = existingProduct.keyFeatures;
      }
    }

    if (productData.department) {
      try {
        productData.department = typeof productData.department === 'string'
          ? JSON.parse(productData.department)
          : productData.department;
      } catch (e) {
        console.error('Error parsing department:', e);
        productData.department = existingProduct.department;
      }
    }

    // ✅ Handle numeric conversions safely
    const numericFields = ['price', 'mrp', 'schedulePrice', 'testCount', 'fromAge', 'toAge'];
    numericFields.forEach(field => {
      if (productData[field]) {
        productData[field] = Number(productData[field]);
        if (isNaN(productData[field])) {
          productData[field] = existingProduct[field] || 0;
        }
      }
    });

    // ✅ Handle boolean fields
    const booleanFields = ['showInHome', 'showHomeBanner', 'status', 'isActive'];
    booleanFields.forEach(field => {
      if (productData[field] !== undefined) {
        productData[field] = productData[field] === 'true' || productData[field] === true;
      }
    });

    // ✅ Handle image update
    if (req.file) {
      // Delete old images if they exist
      if (existingProduct.images && existingProduct.images.length > 0) {
        existingProduct.images.forEach(image => {
          const oldImagePath = path.join(__dirname, '..', image.url);
          if (fs.existsSync(oldImagePath)) {
            fs.unlink(oldImagePath, (err) => {
              if (err) console.error('Error deleting old image:', err);
            });
          }
        });
      }
      
      productData.images = [{
        url: `/uploads/${req.file.filename}`
      }];
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      productData,
      { new: true, runValidators: true }
    ).populate(['category', 'department', 'keyFeatures', 'diseases']);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });

  } catch (error) {
    console.error('Error updating product:', error);
    
    // ✅ Delete uploaded file if there was an error
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

// ✅ FIXED: GET all products with better error handling
router.get('/get_product', async (req, res) => {
  try {
    const products = await Product.find()
      .populate('category')
      .populate('department')
      .populate('keyFeatures')
      .populate('diseases')
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

// ✅ FIXED: GET single product
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
      .populate('diseases');

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

// ✅ FIXED: UPDATE status only
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

// ✅ FIXED: DELETE product
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

    // Delete associated images
    if (product.images && product.images.length > 0) {
      product.images.forEach(image => {
        const imagePath = path.join(__dirname, '..', image.url);
        if (fs.existsSync(imagePath)) {
          fs.unlink(imagePath, (err) => {
            if (err) console.error('Error deleting product image:', err);
          });
        }
      });
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