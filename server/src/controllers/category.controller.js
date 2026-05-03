const { Category } = require('../models');
const { CustomException } = require('../utils');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads');
        // Ensure the directory exists
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

const createCategory = async (request, response) => {
    try {
        if (!request.isAdmin) {
            throw CustomException('Unauthorized: Admin privileges required.', 403);
        }

        const { name, description } = request.body;
        const image = request.file ? `/uploads/${request.file.filename}` : '';

        if (!name) {
            throw CustomException('Category name is required.', 400);
        }

        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            throw CustomException('Category with this name already exists.', 409);
        }

        const newCategory = new Category({
            name,
            description,
            image
        });

        await newCategory.save();

        return response.status(201).send({
            error: false,
            message: 'Category created successfully!',
            category: newCategory
        });
    } catch (error) {
        console.error('Error creating category:', error);
        if (request.file) {
            fs.unlinkSync(request.file.path);
        }
        return response.status(error.status || 500).send({
            error: true,
            message: error.message || 'Failed to create category.'
        });
    }
};

const getAllCategories = async (request, response) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        return response.status(200).send({
            error: false,
            categories
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return response.status(500).send({
            error: true,
            message: 'Failed to fetch categories.'
        });
    }
};

const updateCategory = async (request, response) => {
    try {
        if (!request.isAdmin) {
            throw CustomException('Unauthorized: Admin privileges required.', 403);
        }

        const { id } = request.params;
        const { name, description } = request.body;
        const image = request.file ? `/uploads/${request.file.filename}` : request.body.image_url_unchanged;

        const category = await Category.findById(id);
        if (!category) {
            throw CustomException('Category not found.', 404);
        }

        if (name && name !== category.name) {
            const existingCategory = await Category.findOne({ name });
            if (existingCategory && String(existingCategory._id) !== id) {
                throw CustomException('Category with this name already exists.', 409);
            }
            category.name = name;
        }

        if (description !== undefined) {
            category.description = description;
        }

        // Handle image update
        if (request.file) {
            // Delete old image if it exists and is not the default empty string
            if (category.image && category.image !== '') {
                const oldImagePath = path.join(__dirname, '../..', category.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            category.image = `/uploads/${request.file.filename}`;
        } else if (request.body.clearImage === 'true') {
            // If clearImage flag is sent, remove the image
            if (category.image && category.image !== '') {
                const oldImagePath = path.join(__dirname, '../..', category.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            category.image = '';
        }

        await category.save();

        return response.status(200).send({
            error: false,
            message: 'Category updated successfully!',
            category
        });
    } catch (error) {
        console.error('Error updating category:', error);
        if (request.file) {
            fs.unlinkSync(request.file.path);
        }
        return response.status(error.status || 500).send({
            error: true,
            message: error.message || 'Failed to update category.'
        });
    }
};

const deleteCategory = async (request, response) => {
    try {
        if (!request.isAdmin) {
            throw CustomException('Unauthorized: Admin privileges required.', 403);
        }

        const { id } = request.params;
        const category = await Category.findById(id);

        if (!category) {
            throw CustomException('Category not found.', 404);
        }

        // Delete the image file if it exists
        if (category.image && category.image !== '') {
            const imagePath = path.join(__dirname, '../..', category.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await category.deleteOne();

        return response.status(200).send({
            error: false,
            message: 'Category deleted successfully!'
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        return response.status(error.status || 500).send({
            error: true,
            message: error.message || 'Failed to delete category.'
        });
    }
};

module.exports = {
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory,
    upload
}; 