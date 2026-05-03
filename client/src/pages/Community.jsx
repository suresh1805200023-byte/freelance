import React, { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { userState } from '../atoms';
import { axiosFetch } from '../utils';
import { Loader } from '../components';
import generateImageURL from '../utils/generateImageURL';

const Community = () => {
  const user = useRecoilValue(userState);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState({ title: '', description: '' });
  const [replyText, setReplyText] = useState({});
  const [editingPost, setEditingPost] = useState(null);
  const [editingReply, setEditingReply] = useState(null);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [showPoll, setShowPoll] = useState(false);
  const [poll, setPoll] = useState({ question: '', options: ['', ''] });
  const [votedPolls, setVotedPolls] = useState({});

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data } = await axiosFetch.get('/community/posts');
      setPosts(data);
    } catch (err) {
      setError('Failed to load community posts.');
    } finally {
      setLoading(false);
    }
  };

  const handlePostChange = (e) => {
    setNewPost({ ...newPost, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handlePollChange = (e) => {
    setPoll({ ...poll, [e.target.name]: e.target.value });
  };

  const handlePollOptionChange = (idx, value) => {
    const newOptions = [...poll.options];
    newOptions[idx] = value;
    setPoll({ ...poll, options: newOptions });
  };

  const addPollOption = () => {
    if (poll.options.length < 4) setPoll({ ...poll, options: [...poll.options, ''] });
  };

  const removePollOption = (idx) => {
    if (poll.options.length > 2) setPoll({ ...poll, options: poll.options.filter((_, i) => i !== idx) });
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.description.trim()) return;
    try {
      let imageUrl = '';
      if (imageFile) {
        const uploadRes = await generateImageURL(imageFile);
        imageUrl = uploadRes.secure_url;
      }
      let pollData = undefined;
      if (showPoll && poll.question.trim() && poll.options.filter(opt => opt.trim()).length >= 2) {
        pollData = {
          question: poll.question,
          options: poll.options.filter(opt => opt.trim())
        };
      }
      await axiosFetch.post('/community/posts', { ...newPost, image: imageUrl, poll: pollData });
      setNewPost({ title: '', description: '' });
      setImageFile(null);
      setShowPoll(false);
      setPoll({ question: '', options: ['', ''] });
      fetchPosts();
    } catch (err) {
      setError('Failed to create post.');
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post._id);
    setNewPost({ title: post.title, description: post.description });
  };

  const handleUpdatePost = async (postId) => {
    try {
      await axiosFetch.put(`/community/posts/${postId}`, newPost);
      setEditingPost(null);
      setNewPost({ title: '', description: '' });
      fetchPosts();
    } catch (err) {
      setError('Failed to update post.');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await axiosFetch.delete(`/community/posts/${postId}`);
      fetchPosts();
    } catch (err) {
      setError('Failed to delete post.');
    }
  };

  const handleReplyChange = (postId, value) => {
    setReplyText({ ...replyText, [postId]: value });
  };

  const handleCreateReply = async (postId) => {
    if (!replyText[postId]?.trim()) return;
    try {
      await axiosFetch.post(`/community/posts/${postId}/replies`, { text: replyText[postId] });
      setReplyText({ ...replyText, [postId]: '' });
      fetchPosts();
    } catch (err) {
      setError('Failed to reply.');
    }
  };

  const handleEditReply = (reply) => {
    setEditingReply(reply._id);
    setReplyText({ ...replyText, [reply._id]: reply.text });
  };

  const handleUpdateReply = async (replyId) => {
    try {
      await axiosFetch.put(`/community/replies/${replyId}`, { text: replyText[replyId] });
      setEditingReply(null);
      setReplyText({ ...replyText, [replyId]: '' });
      fetchPosts();
    } catch (err) {
      setError('Failed to update reply.');
    }
  };

  const handleDeleteReply = async (replyId) => {
    if (!window.confirm('Delete this reply?')) return;
    try {
      await axiosFetch.delete(`/community/replies/${replyId}`);
      fetchPosts();
    } catch (err) {
      setError('Failed to delete reply.');
    }
  };

  const handleVote = async (postId, optionIndex) => {
    try {
      await axiosFetch.post(`/community/posts/${postId}/vote`, { optionIndex });
      setVotedPolls({ ...votedPolls, [postId]: optionIndex });
      fetchPosts();
    } catch (err) {
      setError('Failed to vote.');
    }
  };

  if (!user?.isSeller) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Only freelancers (sellers) can access the community.</div>;
  }

  return (
    <div className="community-page" style={{ maxWidth: 1000, margin: '40px auto', padding: 40 }}>
      <h1>Freelancers Community</h1>
      {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
      <form onSubmit={editingPost ? (e) => { e.preventDefault(); handleUpdatePost(editingPost); } : handleCreatePost} style={{ marginBottom: 30 }}>
        <input
          type="text"
          name="title"
          placeholder="Post title"
          value={newPost.title}
          onChange={handlePostChange}
          style={{ width: '100%', marginBottom: 8, padding: 8 }}
        />
        <textarea
          name="description"
          placeholder="Write your post..."
          value={newPost.description}
          onChange={handlePostChange}
          style={{ width: '100%', marginBottom: 8, padding: 8, minHeight: 60 }}
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          style={{ marginBottom: 8 }}
        />
        {imageFile && <div style={{ marginBottom: 8 }}><img src={URL.createObjectURL(imageFile)} alt="preview" style={{ maxWidth: 120, maxHeight: 120, borderRadius: 8 }} /></div>}
        <button type="button" onClick={() => setShowPoll(!showPoll)} style={{ marginBottom: 8, marginRight: 10 }}>
          {showPoll ? 'Cancel Poll' : 'Add Poll'}
        </button>
        {showPoll && (
          <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 8, background: '#fafbfc' }}>
            <input
              type="text"
              name="question"
              placeholder="Poll question"
              value={poll.question}
              onChange={handlePollChange}
              style={{ width: '100%', marginBottom: 8, padding: 8 }}
            />
            {poll.options.map((opt, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                <input
                  type="text"
                  value={opt}
                  onChange={e => handlePollOptionChange(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  style={{ flex: 1, padding: 6 }}
                />
                {poll.options.length > 2 && (
                  <button type="button" onClick={() => removePollOption(idx)} style={{ marginLeft: 6 }}>Remove</button>
                )}
              </div>
            ))}
            {poll.options.length < 4 && (
              <button type="button" onClick={addPollOption} style={{ marginTop: 6 }}>Add Option</button>
            )}
          </div>
        )}
        <button type="submit" style={{ padding: '8px 20px', background: '#1dbf73', color: 'white', border: 'none', borderRadius: 5 }}>
          {editingPost ? 'Update Post' : 'Create Post'}
        </button>
        {editingPost && (
          <button type="button" onClick={() => { setEditingPost(null); setNewPost({ title: '', description: '' }); setImageFile(null); }} style={{ marginLeft: 10 }}>
            Cancel
          </button>
        )}
      </form>
      {loading ? <Loader /> : (
        <div className="community-timeline">
          {posts.length === 0 && <div>No posts yet. Start the conversation!</div>}
          {posts.map(post => (
            <div key={post._id} style={{ border: '1px solid #eee', borderRadius: 12, marginBottom: 32, padding: 28, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <img src={post.user?.image || '/media/noavatar.png'} alt="avatar" style={{ width: 36, height: 36, borderRadius: '50%', marginRight: 10 }} />
                <b>{post.user?.username}</b>
                <span style={{ marginLeft: 10, color: '#888', fontSize: 13 }}>{new Date(post.createdAt).toLocaleString()}</span>
                {post.user?._id === user._id && (
                  <>
                    <button onClick={() => handleEditPost(post)} style={{ marginLeft: 'auto', marginRight: 6 }}>Edit</button>
                    <button onClick={() => handleDeletePost(post._id)}>Delete</button>
                  </>
                )}
              </div>
              <div style={{ fontWeight: 500, fontSize: 18 }}>{post.title}</div>
              <div style={{ margin: '8px 0 12px 0', color: '#444' }}>{post.description}</div>
              {post.image && <img src={post.image} alt="post" style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 8 }} />}
              <div style={{ marginTop: 10 }}>
                <b>Replies:</b>
                {post.replies.length === 0 && <div style={{ color: '#888', fontSize: 13 }}>No replies yet.</div>}
                {post.replies.map(reply => (
                  <div key={reply._id} style={{ display: 'flex', alignItems: 'center', marginTop: 8, marginBottom: 8 }}>
                    <img src={reply.user?.image || '/media/noavatar.png'} alt="avatar" style={{ width: 28, height: 28, borderRadius: '50%', marginRight: 8 }} />
                    <span style={{ fontWeight: 500 }}>{reply.user?.username}</span>
                    <span style={{ marginLeft: 8, color: '#888', fontSize: 12 }}>{new Date(reply.createdAt).toLocaleString()}</span>
                    {editingReply === reply._id ? (
                      <>
                        <input
                          type="text"
                          value={replyText[reply._id] || ''}
                          onChange={e => handleReplyChange(reply._id, e.target.value)}
                          style={{ marginLeft: 8, flex: 1 }}
                        />
                        <button onClick={() => handleUpdateReply(reply._id)} style={{ marginLeft: 6 }}>Save</button>
                        <button onClick={() => setEditingReply(null)} style={{ marginLeft: 6 }}>Cancel</button>
                      </>
                    ) : (
                      <span style={{ marginLeft: 10, flex: 1 }}>{reply.text}</span>
                    )}
                    {reply.user?._id === user._id && editingReply !== reply._id && (
                      <>
                        <button onClick={() => handleEditReply(reply)} style={{ marginLeft: 6 }}>Edit</button>
                        <button onClick={() => handleDeleteReply(reply._id)} style={{ marginLeft: 6 }}>Delete</button>
                      </>
                    )}
                  </div>
                ))}
                <div style={{ marginTop: 8 }}>
                  <textarea
                    placeholder="Write a reply..."
                    value={replyText[post._id] || ''}
                    onChange={e => handleReplyChange(post._id, e.target.value)}
                    style={{ width: '100%', marginRight: 8, minHeight: 48, resize: 'vertical', padding: 10, fontSize: 15 }}
                  />
                  <button onClick={() => handleCreateReply(post._id)} style={{ padding: '4px 14px', background: '#1dbf73', color: 'white', border: 'none', borderRadius: 5 }}>
                    Reply
                  </button>
                </div>
              </div>
              {/* Poll display */}
              {post.poll && post.poll.question && post.poll.options && post.poll.options.length > 0 && (
                <div style={{ margin: '12px 0', padding: 12, background: '#f6fafd', borderRadius: 8 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>{post.poll.question}</div>
                  {post.poll.options.map((opt, idx) => {
                    const totalVotes = post.poll.options.reduce((sum, o) => sum + (o.votes?.length || 0), 0);
                    const voted = opt.votes && opt.votes.some(uid => uid === user._id);
                    const hasVoted = post.poll.options.some(opt => opt.votes && opt.votes.some(uid => uid === user._id));
                    return (
                      <div key={idx} style={{ marginBottom: 6, display: 'flex', alignItems: 'center' }}>
                        {!hasVoted ? (
                          <button onClick={() => handleVote(post._id, idx)} style={{ marginRight: 10, padding: '4px 12px', borderRadius: 5, border: '1px solid #1dbf73', background: '#fff', color: '#1dbf73', cursor: 'pointer' }}>{opt.text}</button>
                        ) : (
                          <span style={{ marginRight: 10, fontWeight: voted ? 700 : 400, color: voted ? '#1dbf73' : '#333' }}>{opt.text}</span>
                        )}
                        <span style={{ fontSize: 13, color: '#888' }}>{opt.votes?.length || 0} votes</span>
                        {hasVoted && (
                          <span style={{ marginLeft: 10, fontSize: 13, color: '#888' }}>
                            {totalVotes > 0 ? `${Math.round((opt.votes?.length || 0) / totalVotes * 100)}%` : '0%'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {post.poll.options.some(opt => opt.votes && opt.votes.some(uid => uid === user._id)) && (
                    <div style={{ fontSize: 12, color: '#1dbf73', marginTop: 6 }}>You have voted in this poll.</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Community; 