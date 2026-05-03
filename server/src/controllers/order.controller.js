const { Order, Gig, Commission } = require('../models');
const { CustomException } = require('../utils');
const User = require('../models/user.model');
const { Review } = require('../models');

const getOrders = async (request, response) => {
    try {
        console.log('Fetching orders for User ID:', request.userID);
        const orders = await Order.find({ $and: [{ $or: [{ sellerID: request.userID }, { buyerID: request.userID }] }, { isCompleted: true }] }).populate(request.isSeller? 'buyerID' : 'sellerID', 'username email image country').sort({ createdAt: 1 });
        console.log('Fetched orders:', orders);
        return response.send(orders);
    }
    catch ({ message, status = 500 }) {
        console.error('Error fetching orders:', message);
        return response.send({
            error: true,
            message
        })
    }
}

const getSingleOrder = async (request, response) => {
    try {
        const order = await Order.findOne({
            gigID: request.params.gigID,
            buyerID: request.userID,
        });

        return response.send(order);
    } catch ({ message, status = 500 }) {
        return response.status(status).send({
            error: true,
            message
        });
    }
};

const paymentIntent = async (request, response) => {
    const { _id } = request.params;

    // Initialize Stripe inside the function to ensure the key is available
    const stripe = require('stripe')(process.env.STRIPE_SECRET);

    try {
        console.log(`Attempting to find gig with ID: ${_id}`);
        const gig = await Gig.findOne({ _id });

        if (!gig) {
            console.error(`Gig with ID ${_id} not found.`);
            return response.status(404).send({
                error: true,
                message: 'Gig not found.'
            });
        }

        // Check if an order for this gig by this buyer already exists and is not completed
        const existingOrder = await Order.findOne({
            gigID: _id,
            buyerID: request.userID,
            isCompleted: false, // Look for uncompleted orders
        });

        if (existingOrder) {
            console.log(`Existing uncompleted order found for gig ID: ${_id}, buyer ID: ${request.userID}. Order ID: ${existingOrder._id}`);
            throw CustomException('You already have an active order for this gig.', 400);
        }

        // Get commission percentage
        let commissionSetting = await Commission.findOne();
        if (!commissionSetting) {
            commissionSetting = new Commission({ percentage: 10 });
            await commissionSetting.save();
        }
        const commissionRate = commissionSetting.percentage / 100;

        // Calculate commission and seller earnings
        const commission = gig.price * commissionRate;
        const sellerEarnings = gig.price - commission;

        console.log(`Gig found: ${gig.title}. Creating Stripe payment intent.`);
        const payment_intent = await stripe.paymentIntents.create({
            amount: gig.price * 100,
            currency: "INR",
            payment_method_types: ["card"], // Only allow card payments
        });
        console.log(`Stripe payment intent created: ${payment_intent.id}`);

        const order = new Order({
            gigID: gig._id,
            image: gig.cover,
            title: gig.title,
            buyerID: request.userID,
            sellerID: gig.userID,
            price: gig.price,
            commission: commission,
            sellerEarnings: sellerEarnings,
            payment_intent: payment_intent.id
        });

        console.log('Saving order with sellerID:', gig.userID);

        await order.save();
        console.log(`Order saved for gig ID: ${gig._id}`);

        console.log(`Sending client secret: ${payment_intent.client_secret}`);
        return response.send({
            error: false,
            clientSecret: payment_intent.client_secret
        });

    }
    catch({message, status = 500}) {
        console.error("Error in paymentIntent:", message);
        return response.status(status).send({
            error: true,
            message
        });
    }
}

const updatePaymentStatus = async (request, response) => {
    const { payment_intent } = request.body;
    console.log(`Received request to update payment status for payment_intent: ${payment_intent}`);

    try {
        const order = await Order.findOneAndUpdate({ payment_intent }, {
            $set: {
                isCompleted: true
            }
        }, { new: true });

        if(order) {
            console.log(`Order found and updated for payment_intent ${payment_intent}. isCompleted: ${order.isCompleted}`);
            if(order.isCompleted) {
                return response.status(202).send({
                    error: false,
                    message: 'Order has been confirmed!'
                })
            }
        }

        console.warn(`Order not found or not updated for payment_intent: ${payment_intent}`);
        throw CustomException('Payment status not updated!', 500);
    }
    catch({message, status = 500}) {
        console.error(`Error in updatePaymentStatus for payment_intent ${payment_intent}: ${message}`);
        return response.status(status).send({
            error: true,
            message
        })
    }
}

const getOrderByPaymentIntent = async (request, response) => {
    try {
        const order = await Order.findOne({ payment_intent: request.params.paymentIntent });

        if (!order) {
            throw CustomException('Order not found for this payment intent!', 404);
        }

        return response.send(order);
    } catch ({ message, status = 500 }) {
        return response.status(status).send({
            error: true,
            message,
        });
    }
};

const submitRequirements = async (request, response) => {
    const { orderId } = request.params;
    const { requirements, requirementsFiles } = request.body;

    try {
        const order = await Order.findOneAndUpdate(
            { _id: orderId, buyerID: request.userID },
            {
                $set: {
                    requirements,
                    requirementsFiles,
                    requirementsSubmitted: true,
                    currentPhase: 'in_progress',
                    'phaseDetails.requirements.submitted': true,
                    'phaseDetails.requirements.submittedAt': new Date(),
                    'phaseDetails.requirements.files': requirementsFiles,
                    'phaseDetails.inProgress.started': true,
                    'phaseDetails.inProgress.startedAt': new Date(),
                    'phaseDetails.inProgress.lastUpdated': new Date()
                }
            },
            { new: true }
        );

        if (!order) {
            throw CustomException('Order not found or user is not the buyer!', 400);
        }

        return response.send({
            error: false,
            message: 'Requirements submitted successfully!',
            order,
        });
    } catch ({ message, status = 500 }) {
        return response.status(status).send({
            error: true,
            message,
        });
    }
};

const submitDelivery = async (request, response) => {
    const { orderId } = request.params;
    const { deliveryNotes, deliveryFiles, deliveryImage, deliveryMessage } = request.body;

    try {
        const order = await Order.findOneAndUpdate(
            { _id: orderId, sellerID: request.userID },
            {
                $set: {
                    deliveryNotes,
                    deliveryFiles,
                    isDelivered: true,
                    currentPhase: 'delivered',
                    revisionRequested: false,
                    'phaseDetails.delivered.delivered': true,
                    'phaseDetails.delivered.deliveredAt': new Date(),
                    'phaseDetails.delivered.deliveryImage': deliveryImage,
                    'phaseDetails.delivered.deliveryMessage': deliveryMessage || "Your order has been successfully delivered!"
                }
            },
            { new: true }
        );

        if (!order) {
            throw CustomException('Order not found or user is not the seller!', 400);
        }

        // Update seller's completedOrderCount and milestone badge
        const seller = await User.findById(order.sellerID);
        if (seller) {
            seller.completedOrderCount = (seller.completedOrderCount || 0) + 1;
            // Milestone badge logic
            if (seller.completedOrderCount >= 100) {
                seller.orderMilestoneBadge = 'Top Performer';
            } else if (seller.completedOrderCount >= 50) {
                seller.orderMilestoneBadge = 'Rising Talent';
            } else if (seller.completedOrderCount >= 10) {
                seller.orderMilestoneBadge = 'Starter Seller';
            } else {
                seller.orderMilestoneBadge = '';
            }
            // XP for order completion
            seller.xp = (seller.xp || 0) + 20;
            await seller.save();
        }

        return response.send({
            error: false,
            message: 'Delivery information updated successfully!',
            order,
        });
    } catch ({ message, status = 500 }) {
        return response.status(status).send({
            error: true,
            message,
        });
    }
};

const getOrder = async (request, response) => {
    try {
        const order = await Order.findOne({ _id: request.params.orderId }).populate('buyerID sellerID', 'username image').populate('gigID', 'revisionNumber');

        if (!order) {
            throw CustomException('Order not found!', 404);
        }

        // Ensure the logged-in user is either the buyer or the seller of this order
        if (order.buyerID._id.toString() !== request.userID.toString() && order.sellerID._id.toString() !== request.userID.toString()) {
            throw CustomException('Unauthorized access to this order!', 403);
        }

        return response.send(order);
    } catch ({ message, status = 500 }) {
        return response.status(status).send({
            error: true,
            message,
        });
    }
};

const submitBuyerFeedback = async (request, response) => {
    const { orderId } = request.params;
    const { buyerRating, buyerReview } = request.body;

    try {
        const order = await Order.findOneAndUpdate(
            { _id: orderId, buyerID: request.userID },
            {
                $set: {
                    buyerRating,
                    buyerReview,
                    deliveryApproved: true,
                }
            },
            { new: true }
        );

        if (!order) {
            throw CustomException('Order not found or user is not the buyer!', 400);
        }

        // Find the associated gig and update its rating and add the review
        await Gig.findByIdAndUpdate(order.gigID, {
            $inc: { totalStars: buyerRating, starNumber: 1 },
            $push: {
                reviews: {
                    userID: request.userID,
                    star: buyerRating,
                    review: buyerReview,
                    createdAt: new Date(),
                },
            },
        }, { new: true });

        // --- FIX: Also create a Review document for admin panel visibility ---
        await Review.create({
            userID: request.userID,
            gigID: order.gigID,
            star: buyerRating,
            description: buyerReview
        });
        // --- END FIX ---

        // Update seller's averageRating, XP, and rating badges
        const seller = await User.findById(order.sellerID);
        if (seller) {
            // Calculate new average rating
            const completedOrders = await Order.find({ sellerID: order.sellerID, isCompleted: true, buyerRating: { $exists: true } });
            const totalRatings = completedOrders.reduce((sum, o) => sum + (o.buyerRating || 0), 0) + buyerRating;
            const ratingCount = completedOrders.length + 1;
            seller.averageRating = totalRatings / ratingCount;

            // XP for 5-star review
            if (buyerRating === 5) {
                seller.xp = (seller.xp || 0) + 50;
                seller.consecutiveFiveStars = (seller.consecutiveFiveStars || 0) + 1;
            } else {
                seller.consecutiveFiveStars = 0;
            }

            // Rating badges
            const badges = [];
            if (seller.averageRating >= 4.8 && ratingCount >= 20) {
                badges.push('Customer Favorite');
            }
            if (seller.consecutiveFiveStars >= 10) {
                badges.push('Perfect 5');
            }
            seller.ratingBadges = badges;

            await seller.save();
        }

        return response.send({
            error: false,
            message: 'Buyer feedback submitted successfully!',
            order,
        });
    } catch ({ message, status = 500 }) {
        return response.status(status).send({
            error: true,
            message,
        });
    }
};

const requestRevision = async (request, response) => {
    const { orderId } = request.params;
    const { message, files } = request.body;

    try {
        const order = await Order.findOneAndUpdate(
            { _id: orderId, buyerID: request.userID },
            {
                $set: {
                    revisionRequested: true,
                    isDelivered: false,
                    currentPhase: 'in_progress',
                    deliveryNotes: '',
                    deliveryFiles: [],
                    'phaseDetails.delivered.delivered': false,
                    'phaseDetails.inProgress.lastUpdated': new Date()
                },
                $push: {
                    revisionDetails: {
                        message: message,
                        timestamp: new Date()
                    },
                    revisionFiles: { $each: files || [] }
                }
            },
            { new: true }
        );

        if (!order) {
            throw CustomException('Order not found or user is not the buyer!', 400);
        }

        return response.send({
            error: false,
            message: 'Revision requested successfully!',
            order,
        });
    } catch ({ message, status = 500 }) {
        return response.status(status).send({
            error: true,
            message,
        });
    }
};

module.exports = {
    getOrders,
    getSingleOrder,
    paymentIntent,
    updatePaymentStatus,
    getOrderByPaymentIntent,
    submitRequirements,
    submitDelivery,
    getOrder,
    submitBuyerFeedback,
    requestRevision
}