const mongoose = require('mongoose');

const CommissionSchema = new mongoose.Schema({
    percentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 10 // Default 10% commission
    }
}, { timestamps: true });

module.exports = mongoose.model('Commission', CommissionSchema);
