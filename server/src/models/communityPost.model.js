const mongoose = require('mongoose');

const communityPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CommunityReply' }],
  poll: {
    question: { type: String },
    options: [
      {
        text: { type: String },
        votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
      }
    ]
  }
}, { timestamps: true });

module.exports = mongoose.model('CommunityPost', communityPostSchema); 