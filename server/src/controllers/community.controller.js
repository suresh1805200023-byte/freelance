const CommunityPost = require('../models/communityPost.model');
const CommunityReply = require('../models/communityReply.model');
const User = require('../models/user.model');

// Only sellers can access
const requireSeller = (req, res, next) => {
  if (!req.userID || !req.isSeller) {
    return res.status(403).json({ error: 'Only freelancers (sellers) can access the community.' });
  }
  next();
};

// Create a new post
const createPost = async (req, res) => {
  try {
    const { title, description, image, poll } = req.body;
    let pollData = undefined;
    if (poll && poll.question && Array.isArray(poll.options)) {
      pollData = {
        question: poll.question,
        options: poll.options.map(opt => ({ text: opt, votes: [] }))
      };
    }
    const post = await CommunityPost.create({
      title,
      description,
      user: req.userID,
      replies: [],
      image,
      poll: pollData
    });
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all posts (timeline)
const getPosts = async (req, res) => {
  try {
    const posts = await CommunityPost.find()
      .populate('user', 'username image')
      .populate({
        path: 'replies',
        populate: { path: 'user', select: 'username image' }
      })
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update own post
const updatePost = async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.user.toString() !== req.userID) return res.status(403).json({ error: 'Unauthorized' });
    post.title = req.body.title || post.title;
    post.description = req.body.description || post.description;
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete own post
const deletePost = async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.user.toString() !== req.userID) return res.status(403).json({ error: 'Unauthorized' });
    // Delete all replies to this post
    await CommunityReply.deleteMany({ post: post._id });
    await post.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a reply
const createReply = async (req, res) => {
  try {
    const { text } = req.body;
    const post = await CommunityPost.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const reply = await CommunityReply.create({
      post: post._id,
      user: req.userID,
      text
    });
    post.replies.push(reply._id);
    await post.save();
    await reply.populate('user', 'username image');
    res.status(201).json(reply);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update own reply
const updateReply = async (req, res) => {
  try {
    const reply = await CommunityReply.findById(req.params.replyId);
    if (!reply) return res.status(404).json({ error: 'Reply not found' });
    if (reply.user.toString() !== req.userID) return res.status(403).json({ error: 'Unauthorized' });
    reply.text = req.body.text || reply.text;
    await reply.save();
    res.json(reply);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete own reply
const deleteReply = async (req, res) => {
  try {
    const reply = await CommunityReply.findById(req.params.replyId);
    if (!reply) return res.status(404).json({ error: 'Reply not found' });
    if (reply.user.toString() !== req.userID) return res.status(403).json({ error: 'Unauthorized' });
    await CommunityPost.findByIdAndUpdate(reply.post, { $pull: { replies: reply._id } });
    await reply.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Vote on a poll
const votePoll = async (req, res) => {
  try {
    const { postId } = req.params;
    const { optionIndex } = req.body;
    const post = await CommunityPost.findById(postId);
    if (!post || !post.poll || !post.poll.options[optionIndex]) {
      return res.status(404).json({ error: 'Poll or option not found' });
    }
    // Prevent double voting
    for (const opt of post.poll.options) {
      opt.votes = opt.votes.filter(uid => uid.toString() !== req.userID);
    }
    post.poll.options[optionIndex].votes.push(req.userID);
    await post.save();
    res.json(post.poll);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  requireSeller,
  createPost,
  getPosts,
  updatePost,
  deletePost,
  createReply,
  updateReply,
  deleteReply,
  votePoll
}; 