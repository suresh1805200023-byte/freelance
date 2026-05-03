const { Dispute, User, Gig, Order } = require('../models');
const { CustomException } = require('../utils');

const createDispute = async (request, response) => {
    const { subject, description, orderGigId } = request.body;

    try {
        if (!request.userID) {
            throw CustomException('Unauthorized: User not authenticated.', 401);
        }

        const newDispute = new Dispute({
            userID: request.userID,
            subject,
            description,
            orderGigId: orderGigId || null,
            status: 'pending'
        });

        await newDispute.save();

        return response.status(201).send({
            error: false,
            message: 'Dispute submitted successfully!',
            dispute: newDispute
        });
    } catch (error) {
        console.error('Error submitting dispute:', error);
        return response.status(error.status || 500).send({
            error: true,
            message: error.message || 'Failed to submit dispute.'
        });
    }
};

const getAllDisputes = async (request, response) => {
    try {
        if (!request.isAdmin) {
            throw CustomException('Unauthorized: Admin privileges required.', 403);
        }
        const disputes = await Dispute.find()
            .populate('userID', 'username email isSeller')
            .sort({ createdAt: -1 });

        return response.status(200).send({
            error: false,
            disputes
        });
    } catch (error) {
        console.error('Error fetching disputes:', error);
        return response.status(error.status || 500).send({
            error: true,
            message: error.message || 'Failed to fetch disputes.'
        });
    }
};

const updateDisputeStatus = async (request, response) => {
    const { id } = request.params;
    const { status } = request.body;

    try {
        if (!request.isAdmin) {
            throw CustomException('Unauthorized: Admin privileges required.', 403);
        }

        if (!['pending', 'in-progress', 'resolved', 'rejected'].includes(status)) {
            throw CustomException('Invalid dispute status.', 400);
        }

        const updatedDispute = await Dispute.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!updatedDispute) {
            throw CustomException('Dispute not found.', 404);
        }

        return response.status(200).send({
            error: false,
            message: 'Dispute status updated successfully!',
            dispute: updatedDispute
        });
    } catch (error) {
        console.error('Error updating dispute status:', error);
        return response.status(error.status || 500).send({
            error: true,
            message: error.message || 'Failed to update dispute status.'
        });
    }
};

module.exports = {
    createDispute,
    getAllDisputes,
    updateDisputeStatus
};
