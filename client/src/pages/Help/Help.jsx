import React, { useState } from 'react';
import './Help.scss';
import toast from 'react-hot-toast';
import { axiosFetch } from '../../utils';

const Help = () => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [orderGigId, setOrderGigId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axiosFetch.post('/disputes', { subject, description, orderGigId });
      toast.success('Dispute submitted successfully!');
      setSubject('');
      setDescription('');
      setOrderGigId('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit dispute.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='help'>
      <div className="container">
        <h1>Help Center</h1>
        <p>This is the help page. You can find answers to frequently asked questions here.</p>
        {/* Add more help content here */}

        <div className="dispute-section">
          <h2>Submit a Dispute</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="subject">Subject:</label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description:</label>
              <textarea
                id="description"
                rows="5"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                disabled={isSubmitting}
              ></textarea>
            </div>
            <div className="form-group">
              <label htmlFor="orderGigId">Related Order/Gig ID (Optional):</label>
              <input
                type="text"
                id="orderGigId"
                value={orderGigId}
                onChange={(e) => setOrderGigId(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Help;
