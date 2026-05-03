const express = require('express');
const { userMiddleware } = require('../middlewares');
const { getOrders, paymentIntent, updatePaymentStatus, getSingleOrder, submitRequirements, getOrderByPaymentIntent, getOrder, submitDelivery, submitBuyerFeedback, requestRevision } = require('../controllers/order.controller');
const app = express.Router();

// Get all
app.get('/', userMiddleware, (request, response, next) => {
    console.log('Inside route handler after userMiddleware. User ID:', request.userID);
    next();
}, getOrders);

// Payment
app.post('/create-payment-intent/:_id', userMiddleware, paymentIntent);

// Payment confirm
app.patch('/', userMiddleware, updatePaymentStatus);

// Get single order by gig ID for the logged-in user
app.get('/single/:gigID', userMiddleware, getSingleOrder);

// Submit requirements for an order
app.post('/:orderId/requirements', userMiddleware, submitRequirements);

// Get order by payment intent
app.get('/payment-intent/:paymentIntent', userMiddleware, getOrderByPaymentIntent);

// Get single order by ID (for both buyer and seller)
app.get('/:orderId', userMiddleware, getOrder);

// Submit delivery for an order (by seller)
app.post('/:orderId/delivery', userMiddleware, (request, response, next) => {
    console.log('Inside delivery route handler after userMiddleware. User ID:', request.userID);
    next();
}, submitDelivery);

// Submit buyer feedback (rating and review) for an order
app.post('/:orderId/feedback', userMiddleware, submitBuyerFeedback);

// Request revision for an order (by buyer)
app.post('/:orderId/revision', userMiddleware, requestRevision);

module.exports = app;