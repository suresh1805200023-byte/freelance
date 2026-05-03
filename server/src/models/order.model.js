const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    gigID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gig',
        required: true,
    },
    image: {
        type: String,
        required: false,
    },
    title: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    sellerID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    buyerID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    isCompleted: {
        type: Boolean,
        default: false,
    },
    payment_intent: {
        type: String,
        required: true,
    },
    requirements: {
        type: String,
        required: false,
    },
    requirementsFiles: {
        type: [String],
        required: false,
        default: [],
    },
    requirementsSubmitted: {
        type: Boolean,
        default: false,
    },
    deliveryNotes: {
        type: String,
        required: false,
    },
    deliveryFiles: {
        type: [String],
        required: false,
        default: [],
    },
    isDelivered: {
        type: Boolean,
        default: false,
    },
    buyerRating: {
        type: Number,
        min: 1,
        max: 5,
        required: false,
    },
    buyerReview: {
        type: String,
        required: false,
    },
    deliveryApproved: {
        type: Boolean,
        default: false,
    },
    revisionRequested: {
        type: Boolean,
        default: false,
    },
    revisionDetails: [
        {
            message: { type: String, required: true },
            timestamp: { type: Date, default: Date.now },
        }
    ],
    revisionFiles: {
        type: [String],
        required: false,
        default: [],
    },
    // New fields for progress tracking
    currentPhase: {
        type: String,
        enum: ['requirements', 'in_progress', 'delivered'],
        default: 'requirements'
    },
    phaseDetails: {
        requirements: {
            submitted: { type: Boolean, default: false },
            submittedAt: { type: Date },
            files: { type: [String], default: [] }
        },
        inProgress: {
            started: { type: Boolean, default: false },
            startedAt: { type: Date },
            lastUpdated: { type: Date }
        },
        delivered: {
            delivered: { type: Boolean, default: false },
            deliveredAt: { type: Date },
            deliveryImage: { type: String },
            deliveryMessage: { type: String }
        }
    },
    commission: {
        type: Number,
        required: false,
        default: 0,
    },
    sellerEarnings: {
        type: Number,
        required: false,
        default: 0,
    },
}, {
    versionKey: false
});

module.exports = mongoose.model('Order', orderSchema);