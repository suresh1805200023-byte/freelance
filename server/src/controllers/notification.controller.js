const { Notification, User } = require('../models');
const { CustomException } = require('../utils');

const broadcastNotification = async (request, response) => {
    const { message, targetAudience } = request.body;

    if (!request.isAdmin) {
        throw CustomException('Unauthorized: Only admins can send broadcast messages.', 403);
    }

    try {
        const notification = new Notification({
            sender: request.userID,
            message,
            targetAudience
        });

        await notification.save();

        // Optionally, you can add logic here to push real-time notifications
        // For example, using websockets (Socket.io) to notify relevant users.

        return response.status(200).send({
            error: false,
            message: 'Broadcast message sent successfully!'
        });

    } catch (error) {
        console.error('Error broadcasting notification:', error);
        return response.status(500).send({
            error: true,
            message: 'Failed to send broadcast message.'
        });
    }
};

const getNotifications = async (request, response) => {
    try {
        const userID = request.userID;
        const isSeller = request.isSeller;
        const isAdmin = request.isAdmin;

        const recipientOnlyFilter = {
            $or: [
                { recipient: { $exists: false } },
                { recipient: null }
            ]
        };

        let query = {};

        if (isAdmin) {
            // Admins can see all notifications.
            query = {};
        } else if (isSeller) {
            // Sellers only see:
            // 1) direct notifications addressed to them
            // 2) broadcast notifications for sellers/all (without recipient)
            query = {
                $or: [
                    { recipient: userID },
                    {
                        $and: [
                            recipientOnlyFilter,
                            { targetAudience: { $in: ['sellers', 'all'] } }
                        ]
                    }
                ]
            };
        } else {
            // Customers only see:
            // 1) direct notifications addressed to them
            // 2) broadcast notifications for customers/all (without recipient)
            query = {
                $or: [
                    { recipient: userID },
                    {
                        $and: [
                            recipientOnlyFilter,
                            { targetAudience: { $in: ['customers', 'all'] } }
                        ]
                    }
                ]
            };
        }

        const notifications = await Notification.find(query).populate('sender', 'username image').sort({ createdAt: -1 });

        // Filter out notifications already read by the current user
        const unreadNotifications = notifications.filter(notification =>
            !notification.readBy.some(readById => readById.toString() === userID.toString())
        );

        return response.status(200).send({
            error: false,
            notifications: unreadNotifications
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return response.status(500).send({
            error: true,
            message: 'Failed to fetch notifications.'
        });
    }
};

const markNotificationAsRead = async (request, response) => {
    const { id } = request.params;
    const userID = request.userID;

    try {
        const notification = await Notification.findById(id);

        if (!notification) {
            throw CustomException('Notification not found!', 404);
        }

        // Add user ID to readBy array if not already present
        if (!notification.readBy.includes(userID)) {
            notification.readBy.push(userID);
            await notification.save();
        }

        return response.status(200).send({
            error: false,
            message: 'Notification marked as read!'
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return response.status(500).send({
            error: true,
            message: 'Failed to mark notification as read.'
        });
    }
};

module.exports = {
    broadcastNotification,
    getNotifications,
    markNotificationAsRead
};
