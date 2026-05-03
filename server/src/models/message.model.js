const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationID: {
        type: String,
        required: true,
    },
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    file: {
        type: String,
        required: false,
    }
}, {
    versionKey: false
});

module.exports = mongoose.model('Message', messageSchema);