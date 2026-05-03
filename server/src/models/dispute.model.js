const mongoose = require('mongoose');

const DisputeSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderGigId: {
        type: String,
        trim: true,
        default: null // Optional: Can be an order ID or gig ID related to the dispute
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'resolved', 'rejected'],
        default: 'pending'
    },
}, { timestamps: true });

module.exports = mongoose.model('Dispute', DisputeSchema);
