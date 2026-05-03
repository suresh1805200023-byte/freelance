const express = require('express');
const { getCommission, updateCommission } = require('../controllers/commission.controller');
const { authenticate, adminMiddleware } = require('../middlewares');

const router = express.Router();

// Get commission percentage (Admin only)
router.get('/', authenticate, adminMiddleware, getCommission);

// Update commission percentage (Admin only)
router.put('/', authenticate, adminMiddleware, updateCommission);

module.exports = router;
