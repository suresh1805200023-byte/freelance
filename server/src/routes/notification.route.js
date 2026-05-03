const express = require('express');
const { broadcastNotification, getNotifications, markNotificationAsRead } = require('../controllers/notification.controller');
const { authenticate, adminMiddleware } = require('../middlewares');

const router = express.Router();

router.post('/', authenticate, adminMiddleware, broadcastNotification);
router.get('/', authenticate, getNotifications);
router.patch('/:id/read', authenticate, markNotificationAsRead);

module.exports = router;
