const express = require('express');
const router = express.Router();
const Product = require('../Models/ListingItems');
const Category = require('../Models/Category');
const Disease = require('../Models/Disease');
const Department = require('../Models/Department');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const { Readable } = require('stream');

function generateSku() {
  return `SKU-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
}

function normalizeOptionalObjectId(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const normalizedValue = String(value).trim();
  return normalizedValue ? normalizedValue : null;
}

function clean(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function toNumber(value, fallback = 0) {
  const normalizedValue = clean(value);
  if (!normalizedValue) return fallback;
  const parsed = Number(normalizedValue);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value, fallback = false) {
  const normalizedValue = clean(value).toLowerCase();
  if (!normalizedValue) return fallback;
  return ['true', '1', 'yes', 'y'].includes(normalizedValue);
}

function toYesNo(value, fallback = 'No') {
  const normalizedValue = clean(value).toLowerCase();
  if (!normalizedValue) return fallback;
  return ['yes', 'true', '1', 'y'].includes(normalizedValue) ? 'Yes' : 'No';
}

function splitList(value) {
  return clean(value)
    .split(/[|,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseCsvBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const rows = [];
    Readable.from(buffer)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('error', reject)
      .on('end', () => resolve(rows));
  });
}

function exactRegex(value) {
  return new RegExp(`^${clean(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
}

async function getNextSortOrder(Model) {
  const lastItem = await Model.findOne().sort({ sortOrder: -1 }).select('sortOrder').lean();
  return lastItem && lastItem.sortOrder ? lastItem.sortOrder + 1 : 1;
}

async function findOrCreateCategory({ name, department, iconimg, bannerimg }) {
  const existingCategory = await Category.findOne({
    name: exactRegex(name),
    department: exactRegex(department),
  });

  if (existingCategory) return existingCategory;

  return Category.create({
    name,
    department,
    iconimg: iconimg || 'bulk-upload-category-placeholder',
    bannerimg: bannerimg || 'bulk-upload-category-placeholder',
    sortOrder: await getNextSortOrder(Category),
    status: true,
  });
}

async function findOrCreateDisease({ name, department, iconimg, description }) {
  if (!name) return null;

  const existingDisease = await Disease.findOne({
    name: exactRegex(name),
    department: exactRegex(department),
  });

  if (existingDisease) return existingDisease;

  return Disease.create({
    name,
    department,
    sortOrder: await getNextSortOrder(Disease),
    status: 'Active',
    iconimg: iconimg || null,
    description: description || '',
    isActive: true,
  });
}

async function findDepartmentsByName(departmentNames) {
  if (!departmentNames.length) return [];

  let departments = await Department.find({
    $or: departmentNames.map((name) => ({ name: exactRegex(name) })),
  }).select('_id');

  if (!departments.length) {
    departments = await Department.find({
      $or: departmentNames.map((name) => ({ name: { $regex: clean(name), $options: 'i' } })),
    }).select('_id');
  }

  return departments.map((department) => department._id);
}

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
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ✅ POST product
const csvUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: function (req, file, cb) {
    const isCsv = file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv';
    if (isCsv) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed!'), false);
    }
  },
  limits: { fileSize: 2 * 1024 * 1024 }
});

// Bulk CSV import for health products/packages.
router.post('/products/bulk-import-csv', csvUpload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required. Upload it with field name csvFile.',
      });
    }

    const rows = await parseCsvBuffer(req.file.buffer);
    const summary = {
      totalRows: rows.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    for (const [index, row] of rows.entries()) {
      const rowNumber = index + 2;
      const name = clean(row.name || row.itemName || row.productName);
      const categoryName = clean(row.category || row.categoryName);
      const diseaseName = clean(row.disease || row.diseaseName);
      const departmentName = clean(row.department || row.departmentName || 'General');
      const city = clean(row.city || 'Jaipur');
      const price = toNumber(row.price, NaN);

      if (!name || !categoryName || !Number.isFinite(price)) {
        summary.skipped += 1;
        summary.errors.push({
          row: rowNumber,
          message: 'name, category and valid price are required',
        });
        continue;
      }

      const category = await findOrCreateCategory({
        name: categoryName,
        department: departmentName,
        iconimg: clean(row.categoryIconImg),
        bannerimg: clean(row.categoryBannerImg),
      });

      const disease = await findOrCreateDisease({
        name: diseaseName,
        department: departmentName,
        iconimg: clean(row.diseaseIconImg),
        description: clean(row.diseaseDescription),
      });

      const departmentIds = await findDepartmentsByName(splitList(row.departments || row.productDepartments || departmentName));
      const submittedSku = clean(row.sku);
      const sku = submittedSku || generateSku();
      const imageUrls = splitList(row.images || row.imageUrl);
      const productData = {
        name,
        itemType: clean(row.itemType) === 'Test' ? 'Test' : 'Package',
        testCount: toNumber(row.testCount, 1),
        sku,
        category: category._id,
        department: departmentIds,
        diseases: disease ? disease._id : null,
        price,
        mrp: toNumber(row.mrp, price),
        schedulePrice: toNumber(row.schedulePrice, price),
        city,
        reportingTime: clean(row.reportingTime),
        specimen: clean(row.specimen),
        fromAge: toNumber(row.fromAge, 0),
        toAge: toNumber(row.toAge, 100),
        gender: ['Male', 'Female'].includes(clean(row.gender)) ? clean(row.gender) : 'Both',
        showIn: clean(row.showIn),
        showPopularPackage: toYesNo(row.showPopularPackage),
        showFullBodyHealthCheckup: toYesNo(row.showFullBodyHealthCheckup),
        showInHome: toBoolean(row.showInHome),
        showHomeBanner: toBoolean(row.showHomeBanner),
        iconImg: clean(row.iconImg || row.imageUrl),
        description: clean(row.description),
        metaTitle: clean(row.metaTitle) || name,
        metaKeywords: clean(row.metaKeywords) || name,
        metaDescription: clean(row.metaDescription) || clean(row.description) || name,
        metaSchema: clean(row.metaSchema),
        images: imageUrls.map((url) => ({ url })),
        status: toBoolean(row.status, true),
        isActive: toBoolean(row.isActive, true),
      };

      const existingProduct = submittedSku
        ? await Product.findOne({ sku: submittedSku })
        : await Product.findOne({ name, category: category._id, city });

      if (existingProduct) {
        await Product.findByIdAndUpdate(existingProduct._id, productData, { runValidators: true });
        summary.updated += 1;
      } else {
        await Product.create(productData);
        summary.created += 1;
      }
    }

    res.status(200).json({
      success: true,
      message: 'CSV import completed',
      ...summary,
    });
  } catch (error) {
    console.error('CSV import error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

router.post('/post_product', upload.single('iconImg'), async (req, res) => {
  try {
    const productData = { ...req.body };

    console.log('Received data:', productData);
    console.log('File received:', req.file);

    const arrayFields = ['keyFeatures', 'department', 'faqs'];
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

    const numericFields = ['price', 'mrp', 'schedulePrice', 'testCount', 'fromAge', 'toAge'];
    numericFields.forEach(field => {
      if (productData[field] !== undefined && productData[field] !== '') {
        productData[field] = Number(productData[field]);
        if (isNaN(productData[field])) {
          productData[field] = field === 'testCount' ? 1 : 0;
        }
      }
    });

    const booleanFields = ['showInHome', 'showHomeBanner', 'status'];
    booleanFields.forEach(field => {
      if (productData[field] !== undefined) {
        productData[field] = productData[field] === 'true' || productData[field] === true || productData[field] === '1';
      }
    });

    // ✅ FIX — showFullBodyHealthCheckup aur showPopularPackage ko
    // boolean mein convert hone se bachao, "Yes"/"No" string hi rehne do
    const stringEnumFields = ['showFullBodyHealthCheckup', 'showPopularPackage'];
    stringEnumFields.forEach(field => {
      if (productData[field] !== undefined) {
        productData[field] = productData[field] === 'Yes' ? 'Yes' : 'No';
      }
    });

    if (req.file) {
      productData.iconImg = req.file.filename;
    }

    if (!productData.metaTitle && productData.name) productData.metaTitle = productData.name;
    if (!productData.metaKeywords && productData.name) productData.metaKeywords = productData.name;
    if (!productData.metaDescription && productData.name) productData.metaDescription = productData.name;

    if (!productData.city) {
      return res.status(400).json({ success: false, message: 'City is required' });
    }

    if (!productData.sku || !String(productData.sku).trim()) {
      productData.sku = generateSku();
    }

    ['lab', 'certificate', 'diseases'].forEach(field => {
      const normalizedValue = normalizeOptionalObjectId(productData[field]);
      if (normalizedValue !== undefined) {
        productData[field] = normalizedValue;
      }
    });

    const product = new Product(productData);
    await product.save();

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

// ✅ UPDATE product route
router.put('/items/:id', upload.single('iconImg'), async (req, res) => {
  try {
    const { id } = req.params;
    const productData = { ...req.body };

    console.log('Updating product ID:', id);
    console.log('Update data received:', productData);

    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const arrayFields = ['keyFeatures', 'department', 'faqs'];
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

    const numericFields = ['price', 'mrp', 'schedulePrice', 'testCount', 'fromAge', 'toAge'];
    numericFields.forEach(field => {
      if (productData[field] !== undefined && productData[field] !== '') {
        productData[field] = Number(productData[field]);
        if (isNaN(productData[field])) {
          productData[field] = existingProduct[field] || (field === 'testCount' ? 1 : 0);
        }
      }
    });

    const booleanFields = ['showInHome', 'showHomeBanner', 'status'];
    booleanFields.forEach(field => {
      if (productData[field] !== undefined) {
        productData[field] = productData[field] === 'true' || productData[field] === true || productData[field] === '1';
      }
    });

    // ✅ FIX — showFullBodyHealthCheckup ko "Yes"/"No" string hi rehne do
    // boolean mein convert hone se bachao — yahi asli bug tha
    const stringEnumFields = ['showFullBodyHealthCheckup', 'showPopularPackage'];
    stringEnumFields.forEach(field => {
      if (productData[field] !== undefined) {
        productData[field] = productData[field] === 'Yes' ? 'Yes' : 'No';
        console.log(`${field} set to:`, productData[field]); // ✅ verify karo
      }
    });

    if (productData.sku !== undefined) {
      productData.sku = String(productData.sku).trim();
      if (!productData.sku) {
        productData.sku = existingProduct.sku || generateSku();
      }
    }

    ['lab', 'certificate', 'diseases'].forEach(field => {
      const normalizedValue = normalizeOptionalObjectId(productData[field]);
      if (normalizedValue !== undefined) {
        productData[field] = normalizedValue;
      }
    });

    if (req.file) {
      if (existingProduct.iconImg) {
        const oldImagePath = path.join(__dirname, '..', 'uploads', existingProduct.iconImg);
        if (fs.existsSync(oldImagePath)) {
          fs.unlink(oldImagePath, (err) => {
            if (err) console.error('Error deleting old image:', err);
          });
        }
      }
      productData.iconImg = req.file.filename;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      productData,
      { new: true, runValidators: true }
    ).populate(['category', 'department', 'keyFeatures', 'diseases', 'certificate', 'lab']);

    console.log('Updated showFullBodyHealthCheckup:', updatedProduct.showFullBodyHealthCheckup); // ✅ verify

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });

  } catch (error) {
    console.error('Error updating product:', error);
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

// ✅ GET all products
router.get('/get_product', async (req, res) => {
  try {
    const filter = {};

    if (req.query.city) {
      filter.city = new RegExp(`^${req.query.city.trim()}$`, 'i');
    }
    if (req.query.category) filter.category = req.query.category;
    if (req.query.diseases) filter.diseases = req.query.diseases;
    if (req.query.department) filter.department = req.query.department;
    if (req.query.status !== undefined) {
      filter.status = req.query.status === 'true' || req.query.status === true || req.query.status === '1';
    }

    const products = await Product.find(filter)
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

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID format' });
    }

    const product = await Product.findById(id)
      .populate('category')
      .populate('department')
      .populate('keyFeatures')
      .populate('diseases')
      .populate('certificate')
      .populate('lab');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
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

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID format' });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { isActive: isActive, status: isActive },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      message: `Product ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: product
    });
  } catch (error) {
    console.error('Error toggling status:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// ✅ DELETE product
router.delete('/delete_product/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID format' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.iconImg) {
      const imagePath = path.join(__dirname, '..', 'uploads', product.iconImg);
      if (fs.existsSync(imagePath)) {
        fs.unlink(imagePath, (err) => {
          if (err) console.error('Error deleting product image:', err);
        });
      }
    }

    await Product.findByIdAndDelete(id);

    res.json({ success: true, message: 'Product deleted successfully' });
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
