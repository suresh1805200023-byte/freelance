const express = require('express');
const { userMiddleware, adminMiddleware } = require('../middlewares');
const { createGig, deleteGig, getGig, getGigs, updateGigStatus, getPendingApprovalGigs, approveGig, rejectGig, sendForApproval } = require('../controllers/gig.controller');

const app = express.Router();

// Create
app.post('/', userMiddleware, createGig);

// Delete
app.delete('/:_id', userMiddleware, deleteGig);

// Get single
app.get('/single/:_id', getGig);

// Get all (for normal users with filters)
app.get('/', getGigs);

// Admin route to get all gigs (without filters)
app.get('/all', adminMiddleware, getGigs);

// Admin route to update gig status (activate/deactivate)
app.patch('/:_id/status', adminMiddleware, updateGigStatus);

// Admin: Get all gigs pending approval
app.get('/pending-approval', adminMiddleware, getPendingApprovalGigs);

// Admin: Approve a gig
app.patch('/approve/:_id', adminMiddleware, approveGig);

// Admin: Reject a gig
app.patch('/reject/:_id', adminMiddleware, rejectGig);

// Seller: Send gig for approval
app.patch('/send-for-approval/:_id', userMiddleware, sendForApproval);

module.exports = app;