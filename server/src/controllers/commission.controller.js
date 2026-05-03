const { Commission } = require('../models');
const { CustomException } = require('../utils');

const getCommission = async (request, response) => {
    try {
        // No admin check needed here as it's a getter, but the route will be protected
        let commission = await Commission.findOne();

        // If no commission setting exists, create a default one
        if (!commission) {
            commission = new Commission({ percentage: 10 }); // Default 10%
            await commission.save();
        }

        return response.status(200).send({
            error: false,
            commission
        });
    } catch (error) {
        console.error('Error fetching commission:', error);
        return response.status(error.status || 500).send({
            error: true,
            message: error.message || 'Failed to fetch commission.'
        });
    }
};

const updateCommission = async (request, response) => {
    const { percentage } = request.body;

    try {
        if (!request.isAdmin) {
            throw CustomException('Unauthorized: Admin privileges required.', 403);
        }

        if (typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
            throw CustomException('Invalid commission percentage. Must be a number between 0 and 100.', 400);
        }

        let commission = await Commission.findOne();

        if (!commission) {
            commission = new Commission({ percentage });
        } else {
            commission.percentage = percentage;
        }

        await commission.save();

        return response.status(200).send({
            error: false,
            message: 'Commission percentage updated successfully!',
            commission
        });
    } catch (error) {
        console.error('Error updating commission:', error);
        return response.status(error.status || 500).send({
            error: true,
            message: error.message || 'Failed to update commission.'
        });
    }
};

module.exports = {
    getCommission,
    updateCommission
};
