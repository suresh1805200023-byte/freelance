const express = require('express');
const { createDispute, getAllDisputes, updateDisputeStatus } = require('../controllers/dispute.controller');
const { authenticate, adminMiddleware } = require('../middlewares');

const router = express.Router();

// Create a new dispute (User authenticated)
router.post('/', authenticate, createDispute);

// Get all disputes (Admin only)
router.get('/', authenticate, adminMiddleware, getAllDisputes);

// Update dispute status (Admin only)
router.put('/:id/status', authenticate, adminMiddleware, updateDisputeStatus);

module.exports = router;
