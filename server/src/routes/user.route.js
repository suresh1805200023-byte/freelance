const express = require('express');
const { userMiddleware, adminMiddleware, authenticate } = require('../middlewares');
const { deleteUser, getAllUsers, updateUserStatus, addToWishlist, removeFromWishlist, getWishlist } = require('../controllers/user.controller');

const app = express.Router();

// Admin route to get all users
app.get('/', authenticate, adminMiddleware, getAllUsers);

// Admin route to update user status
app.patch('/:_id/status', adminMiddleware, updateUserStatus);

app.delete('/:_id', userMiddleware, deleteUser);

// Wishlist routes
app.post('/wishlist/:gigId', userMiddleware, addToWishlist);
app.delete('/wishlist/:gigId', userMiddleware, removeFromWishlist);
app.get('/wishlist', userMiddleware, getWishlist);

module.exports = app;