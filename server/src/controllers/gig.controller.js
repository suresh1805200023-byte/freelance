const { Gig } = require('../models');
const { CustomException } = require('../utils');
const { Notification } = require('../models');

const createGig = async (request, response) => {
    try {

        if (!request.isSeller) {
            throw CustomException('Only sellers can create new Gigs!', 403);
        }

        const gig = new Gig({
            userID: request.userID,
            ...request.body,
            isActive: false,
            status: 'pending_approval'
        });
        await gig.save();
        return response.status(201).send(gig);
    }
    catch ({ message, status = 500 }) {
        return response.status(status).send({
            error: true,
            message
        })
    }
}

const deleteGig = async (request, response) => {
    const { _id } = request.params;

    try {
        const gig = await Gig.findOne({ _id });
        if (request.userID === gig.userID.toString()) {
            await Gig.deleteOne({ _id });
            return response.send({
                error: false,
                message: 'Gig had been successfully deleted!'
            })
        }

        throw CustomException('Invalid request! Cannot delete other user gigs!', 403);
    }
    catch ({ message, status = 500 }) {
        return response.status(status).send({
            error: true,
            message
        })
    }
}

const getGig = async (request, response) => {
    const { _id } = request.params;

    try {
        const gig = await Gig.findOne({ _id })
            .populate('userID', 'username country image createdAt email phone description completedOrderCount orderMilestoneBadge xp averageRating consecutiveFiveStars ratingBadges')
            .populate({path: 'reviews.userID', select: 'username country image'});
        if (!gig) {
            throw CustomException('Gig not found!', 404);
        }
        return response.send(gig);
    }
    catch ({ message, status = 500 }) {
        return response.status(status).send({
            error: true,
            message
        })
    }
}

const getGigs = async (request, response) => {
    const { category, search, max, min, userID, sort } = request.query;
    try {
        const filters = {
            ...(userID && { userID }),
            ...(category && { category: { $regex: category, $options: 'i' } }),
            ...(search && { title: { $regex: search, $options: 'i' } }),
            ...((min || max) && {
                price: {
                    ...(max && { $lte: max }),
                    ...(min && { $gte: min }),
                },
            }),
            status: 'approved',
        }

        const gigs = await Gig.find(filters).sort({ [sort]: -1 }).populate('userID', 'username cover email description isSeller _id image');
        console.log("getGigs - Gigs found:", gigs.length);
        if (gigs.length > 0) {
            console.log("getGigs - Sample gig status:", gigs[0].status, "isActive:", gigs[0].isActive);
        }
        return response.send(gigs);
    }
    catch ({ message, status = 500 }) {
        console.error("Error in getGigs:", message);
        return response.status(status).send({
            error: true,
            message
        })
    }
}

const updateGigStatus = async (request, response) => {
    const { _id } = request.params;
    const { isActive } = request.body; // Expecting isActive (boolean) in the request body

    try {
        // Find the gig and update its isActive status
        const updatedGig = await Gig.findByIdAndUpdate(_id, { $set: { isActive } }, { new: true });

        if (!updatedGig) {
            throw CustomException('Gig not found!', 404);
        }

        return response.send({
            error: false,
            message: `Gig status updated to ${isActive ? 'active' : 'inactive'}!`, // Informative message
            gig: updatedGig // Return the updated gig data
        });

    } catch ({ message, status = 500 }) {
        return response.status(status).send({
            error: true,
            message: message || 'Something went wrong updating gig status!'
        });
    }
};

const getPendingApprovalGigs = async (request, response) => {
    try {
        if (!request.isAdmin) {
            throw CustomException('Unauthorized: Admin privileges required.', 403);
        }
        const gigs = await Gig.find({ status: 'pending_approval' }).populate('userID', 'username email image');
        return response.status(200).send({ error: false, gigs });
    } catch ({ message, status = 500 }) {
        return response.status(status).send({ error: true, message });
    }
};

const approveGig = async (request, response) => {
    try {
        if (!request.isAdmin) {
            throw CustomException('Unauthorized: Admin privileges required.', 403);
        }
        const { _id } = request.params;
        const gig = await Gig.findByIdAndUpdate(_id, { status: 'approved', isActive: true }, { new: true });
        if (!gig) {
            throw CustomException('Gig not found!', 404);
        }
        // Notify seller
        await Notification.create({
            sender: request.userID,
            recipient: gig.userID,
            message: `Your gig "${gig.title}" has been approved and published!`,
            targetAudience: 'sellers'
        });
        return response.status(200).send({ error: false, message: 'Gig approved!', gig });
    } catch ({ message, status = 500 }) {
        return response.status(status).send({ error: true, message });
    }
};

const rejectGig = async (request, response) => {
    try {
        if (!request.isAdmin) {
            throw CustomException('Unauthorized: Admin privileges required.', 403);
        }
        const { _id } = request.params;
        const gig = await Gig.findByIdAndUpdate(_id, { status: 'rejected', isActive: false }, { new: true });
        if (!gig) {
            throw CustomException('Gig not found!', 404);
        }
        // Notify seller
        await Notification.create({
            sender: request.userID,
            recipient: gig.userID,
            message: `Your gig "${gig.title}" has been rejected. Please review and update your gig.`,
            targetAudience: 'sellers'
        });
        return response.status(200).send({ error: false, message: 'Gig rejected!', gig });
    } catch ({ message, status = 500 }) {
        return response.status(status).send({ error: true, message });
    }
};

const sendForApproval = async (request, response) => {
    try {
        const { _id } = request.params;
        // Only the gig owner can send for approval
        const gig = await Gig.findOneAndUpdate(
            { _id, userID: request.userID },
            { status: 'pending_approval' },
            { new: true }
        );
        if (!gig) {
            throw CustomException('Gig not found or not authorized!', 404);
        }
        return response.status(200).send({ error: false, message: 'Gig sent for approval!', gig });
    } catch ({ message, status = 500 }) {
        return response.status(status).send({ error: true, message });
    }
};

module.exports = {
    createGig,
    deleteGig,
    getGig,
    getGigs,
    updateGigStatus,
    getPendingApprovalGigs,
    approveGig,
    rejectGig,
    sendForApproval
}