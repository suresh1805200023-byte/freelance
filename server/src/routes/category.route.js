const express = require('express');
const { createCategory, getAllCategories, updateCategory, deleteCategory, upload } = require('../controllers/category.controller');
const { authenticate, adminMiddleware } = require('../middlewares');

const router = express.Router();

// Create a new category (Admin only, with image upload)
router.post('/', authenticate, adminMiddleware, upload.single('image'), createCategory);

// Get all categories
router.get('/', getAllCategories);

// Update a category (Admin only, with optional image upload)
router.put('/:id', authenticate, adminMiddleware, upload.single('image'), updateCategory);

// Delete a category (Admin only)
router.delete('/:id', authenticate, adminMiddleware, deleteCategory);

module.exports = router; 