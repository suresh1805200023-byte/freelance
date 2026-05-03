const mongoose = require('mongoose');

const LoginLogSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true }); // Add timestamps for createdAt and updatedAt

module.exports = mongoose.model('LoginLog', LoginLogSchema);
