const { Review, Gig } = require('../models');
const { CustomException } = require('../utils');

const createReview = async(request, response) => {
    const { gigID, star, description } = request.body;

    try {
        if(request.isSeller) {
            throw CustomException("Sellers can't create reviews!", 403);
        }
        const review = new Review({
            userID: request.userID,
            gigID,
            star,
            description
        });
        await Gig.findByIdAndUpdate(gigID, { $inc: { totalStars: star, starNumber: 1 } });
        await review.save();

        return response.status(201).send({
            error: false,
            review
        })
    }
    catch({message, status = 500}) {
        return response.status(status).send({
            error: false,
            message
        })
    }
}

const getReview = async (request, response) => {
    const { gigID } = request.params;
    
    try {
        const reviews = await Review.find({ gigID }).populate('userID', 'username image email country');
        return response.status(200).send(reviews);
    }
    catch({message, status = 500}) {
        return response.status(status).send({
            error: false,
            message
        })
    }
}

const getAllReviews = async (request, response) => {
    try {
        if (!request.isAdmin) {
            console.error('Admin check failed in getAllReviews. request.isAdmin:', request.isAdmin);
            throw CustomException('Unauthorized: Admin privileges required.', 403);
        }
        const reviews = await Review.find().populate('userID', 'username email').populate('gigID', 'title');
        console.log('Fetched all reviews for admin:', reviews);
        return response.status(200).send({
            error: false,
            reviews
        });
    } catch (error) {
        console.error('Error fetching all reviews:', error);
        return response.status(error.status || 500).send({
            error: true,
            message: error.message || 'Failed to fetch all reviews.'
        });
    }
};

const deleteReview = async (request, response) => {
    const { _id } = request.params;
    try {
        // Only allow admin to delete any review, or the user who created the review
        const review = await Review.findById(_id);
        if (!review) {
            throw CustomException('Review not found!', 404);
        }

        if (request.isAdmin || review.userID.toString() === request.userID) {
            await Review.findByIdAndDelete(_id);
            return response.status(200).send({
                error: false,
                message: 'Review deleted successfully!'
            });
        } else {
            throw CustomException('Forbidden: You are not authorized to delete this review.', 403);
        }
    } catch (error) {
        console.error('Error deleting review:', error);
        return response.status(error.status || 500).send({
            error: true,
            message: error.message || 'Failed to delete review.'
        });
    }
};

module.exports = {
    createReview,
    getReview,
    deleteReview,
    getAllReviews
}