const express = require('express');
const {
  requireSeller,
  createPost,
  getPosts,
  updatePost,
  deletePost,
  createReply,
  updateReply,
  deleteReply,
  votePoll
} = require('../controllers/community.controller');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

// All routes require authentication and seller status
router.use(authenticate, requireSeller);

// Posts
router.post('/posts', createPost);
router.get('/posts', getPosts);
router.put('/posts/:id', updatePost);
router.delete('/posts/:id', deletePost);

// Replies
router.post('/posts/:postId/replies', createReply);
router.put('/replies/:replyId', updateReply);
router.delete('/replies/:replyId', deleteReply);

// Vote
router.post('/posts/:postId/vote', votePoll);

module.exports = router; 