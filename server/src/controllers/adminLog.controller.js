const { LoginLog } = require('../models');
const { CustomException } = require('../utils');

const getLoginLogs = async (request, response) => {
    try {
        if (!request.isAdmin) {
            throw CustomException('Unauthorized: Admin privileges required.', 403);
        }

        const loginLogs = await LoginLog.find().populate('userID', 'username email').sort({ timestamp: -1 });

        return response.status(200).send({
            error: false,
            loginLogs
        });
    } catch (error) {
        console.error('Error fetching login logs:', error);
        return response.status(error.status || 500).send({
            error: true,
            message: error.message || 'Failed to fetch login logs.'
        });
    }
};

module.exports = {
    getLoginLogs,
};
