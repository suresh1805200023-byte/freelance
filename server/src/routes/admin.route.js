const express = require('express');
const { getDashboardStats, getMaxFailedLoginAttempts, getSuspiciousReviews } = require('../controllers/admin.controller');
const { authenticate, adminMiddleware } = require('../middlewares');

const router = express.Router();

router.get('/dashboard', authenticate, adminMiddleware, getDashboardStats);
router.get('/max-failed-logins', adminMiddleware, getMaxFailedLoginAttempts);
router.get('/review-legitimacy', adminMiddleware, getSuspiciousReviews);

module.exports = router;
