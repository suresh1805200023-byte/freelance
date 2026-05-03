const express = require('express');
const { createReview, getReview, deleteReview, getAllReviews } = require('../controllers/review.controller');
const { userMiddleware, authenticate, adminMiddleware } = require('../middlewares');

const app = express.Router();

// Create
app.post('/', userMiddleware, createReview);

// Get all reviews (Admin only)
app.get('/', authenticate, adminMiddleware, getAllReviews);

// Get single
app.get('/:gigID', getReview);

// Delete
app.delete('/:_id', authenticate, userMiddleware, deleteReview);

module.exports = app;