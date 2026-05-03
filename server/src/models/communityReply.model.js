const mongoose = require('mongoose');

const communityReplySchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityPost', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('CommunityReply', communityReplySchema); 