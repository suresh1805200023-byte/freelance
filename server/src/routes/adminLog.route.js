const express = require('express');
const { getLoginLogs } = require('../controllers/adminLog.controller');
const { authenticate, adminMiddleware } = require('../middlewares');

const router = express.Router();

router.get('/loginLogs', authenticate, adminMiddleware, getLoginLogs);

module.exports = router;
