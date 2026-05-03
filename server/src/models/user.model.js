const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: false,
    },
    phone: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    isSeller: {
        type: Boolean,
        default: false,
        required: false,
    },
    country: {
        type: String,
        required: false,
    },
    languagesKnown: {
        type: [String],
        required: false,
    },
    motherLanguage: {
        type: String,
        required: false,
    },
    isAdmin: {
        type: Boolean,
        default: false,
        required: false,
    },
    isActive: {
        type: Boolean,
        default: true,
        required: false,
    },
    wishlist: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Gig',
        }
    ],
    // Gamification fields
    completedOrderCount: {
        type: Number,
        default: 0,
    },
    orderMilestoneBadge: {
        type: String,
        default: '', // e.g., 'Starter Seller', 'Rising Talent', 'Top Performer'
    },
    xp: {
        type: Number,
        default: 0,
    },
    averageRating: {
        type: Number,
        default: 0,
    },
    consecutiveFiveStars: {
        type: Number,
        default: 0,
    },
    ratingBadges: {
        type: [String],
        default: [], // e.g., ['Customer Favorite', 'Perfect 5']
    },
    failedLoginAttempts: {
        type: Number,
        default: 0,
    },
    lockUntil: {
        type: Date,
        default: null,
    },
}, {
    versionKey: false,
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);