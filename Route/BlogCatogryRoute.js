const express = require('express');
const router = express.Router();
const BlogCategory = require('../Models/Blogcatogry');

// GET ALL CATEGORIES
router.get('/categorybloget', async (req, res) => {
  try {
    const { search, page = 1, limit = 10, sortBy = 'sortOrder', order = 'asc' } = req.query;
    
    let query = {};
    
    // Search functionality
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    // Sort functionality
    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;
    
    const categories = await BlogCategory.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');
    
    const total = await BlogCategory.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: categories,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    })
    
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching categories', 
      error: error.message 
    });
  }
});

// GET SINGLE CATEGORY BY ID
router.get('/categorybloggetid/:id', async (req, res) => {
  try {
    const category = await BlogCategory.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
    
  } catch (error) {
    console.error('Get category error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
});

// CREATE NEW CATEGORY
router.post('/categoryblog/post', async (req, res) => {
  try {
    const { name, sortOrder, status } = req.body;
    
    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }
    
    if (sortOrder && sortOrder < 1) {
      return res.status(400).json({
        success: false,
        message: 'Sort order must be at least 1'
      });
    }
    
    // Check if category already exists
    const existingCategory = await BlogCategory.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });
    
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }
    
    const categoryData = {
      name: name.trim(),
      sortOrder: sortOrder || 1,
      status: status || 'Active'
    };
    
    const newCategory = await BlogCategory.create(categoryData);
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: newCategory
    });
    
  } catch (error) {
    console.error('Create category error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
});

// UPDATE CATEGORY
router.put('/categoryblogput/:id', async (req, res) => {
  try {
    const { name, sortOrder, status } = req.body;
    
    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }
    
    if (sortOrder && sortOrder < 1) {
      return res.status(400).json({
        success: false,
        message: 'Sort order must be at least 1'
      });
    }
    
    // Check if category exists
    const existingCategory = await BlogCategory.findById(req.params.id);
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Check for duplicate name (excluding current category)
    const duplicateCategory = await BlogCategory.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      _id: { $ne: req.params.id }
    });
    
    if (duplicateCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }
    
    const updateData = {
      name: name.trim(),
      sortOrder: sortOrder || existingCategory.sortOrder,
      status: status || existingCategory.status
    };
    
    const updatedCategory = await BlogCategory.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });
    
  } catch (error) {
    console.error('Update category error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: error.message
    });
  }
});

// DELETE SINGLE CATEGORY
router.delete('/categoryblogid/:id', async (req, res) => {
  try {
    const category = await BlogCategory.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    await BlogCategory.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete category error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
});

// BULK DELETE CATEGORIES
router.delete('/catogryblog/delete', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Category IDs are required for bulk delete'
      });
    }
    
    const result = await BlogCategory.deleteMany({
      _id: { $in: ids }
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No categories found to delete'
      });
    }
    
    res.status(200).json({
      success: true,
      message: `${result.deletedCount} categories deleted successfully`
    });
    
  } catch (error) {
    console.error('Bulk delete categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting categories',
      error: error.message
    });
  }
});

module.exports = router;