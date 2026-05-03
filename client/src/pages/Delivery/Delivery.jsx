import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Import useParams and useNavigate
import { useQuery } from '@tanstack/react-query'; // Import useQuery
import { axiosFetch, generateImageURL } from '../../utils'; // Import axiosFetch
import { Loader } from '../../components'; // Import Loader
import toast from 'react-hot-toast'; // Import toast
import './Delivery.scss';

const Delivery = () => {
  const { orderId } = useParams(); // Get orderId from URL
  const navigate = useNavigate();

  // State for feedback form
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [buyerRating, setBuyerRating] = useState(0);
  const [buyerReview, setBuyerReview] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [showRevisionRequestForm, setShowRevisionRequestForm] = useState(false);
  const [revisionRequestMessage, setRevisionRequestMessage] = useState('');
  const [selectedRevisionFiles, setSelectedRevisionFiles] = useState([]); // New state for revision files
  const [showReviewSuccessMessage, setShowReviewSuccessMessage] = useState(false); // New state for review success message

  // Fetch order details
  const { isLoading, error, data: order, refetch } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () =>
      axiosFetch.get(`/orders/${orderId}`)
        .then(({ data }) => data)
        .catch((err) => {
            toast.error(err?.response?.data?.message || 'Failed to fetch order');
            throw err; // Re-throw to let react-query handle it
        }),
    enabled: !!orderId, // Only run this query if orderId is available
  });

  const totalRevisionsAllowed = order?.gigID?.revisionNumber || 0;
  const revisionsUsed = order?.revisionDetails?.length || 0;
  const hasRevisionsLeft = revisionsUsed < totalRevisionsAllowed;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Reset forms if order is delivered and no revision is currently requested
    if (order && order.isDelivered && !order.revisionRequested) {
      setShowFeedbackForm(false);
      setShowRevisionRequestForm(false);
    }
  }, [order, isLoading]); // Depend on order and isLoading to re-evaluate after fetch

  if (isLoading) {
    return <div className="loader"><Loader /></div>;
  }

  if (error) {
    return <div className="error-message">Error loading order details.</div>;
  }

  if (!order) {
      return <div className="not-found">Order not found.</div>;
  }

  const handleApproveDelivery = () => {
    setShowFeedbackForm(true);
  };

  const handleNotReady = () => {
    console.log("handleNotReady called. Setting showRevisionRequestForm to true.");
    setShowRevisionRequestForm(true);
    console.log("showRevisionRequestForm after setting:", true); // Log the new value directly
  };

  const handleRevisionFileChange = (event) => {
    setSelectedRevisionFiles([...event.target.files]);
  };

  const handleSendRevisionRequest = async () => {
    if (!revisionRequestMessage.trim()) {
      toast.error("Please provide a revision request message.");
      return;
    }

    let uploadedRevisionFileUrls = [];

    if (selectedRevisionFiles.length > 0) {
      toast("Uploading revision files...");
      try {
        uploadedRevisionFileUrls = await Promise.all(
          selectedRevisionFiles.map(async (file) => {
            const uploadResponse = await generateImageURL(file);
            return uploadResponse.url;
          })
        );
        toast.success("Revision files uploaded successfully!");
      } catch (uploadError) {
        console.error("Revision file upload failed:", uploadError);
        toast.error("Revision file upload failed. See console for details.");
        return;
      }
    }

    try {
      await axiosFetch.post(`/orders/${order._id}/revision`, {
        message: revisionRequestMessage,
        files: uploadedRevisionFileUrls, // Send files to backend
      });
      toast.success("Revision request sent successfully!");
      setShowRevisionRequestForm(false);
      setSelectedRevisionFiles([]); // Clear selected files
      setRevisionRequestMessage(''); // Clear message
      refetch(); // Refetch order to update revision count
    } catch (error) {
      console.error("Revision request failed:", error);
      toast.error(error?.response?.data?.message || "Failed to send revision request.");
    }
  };

  const handleSubmitFeedback = async () => {
      if (buyerRating === 0) {
          toast.error("Please provide a rating.");
          return;
      }
      
      try {
          // API call to submit buyer feedback
          await axiosFetch.post(`/orders/${order._id}/feedback`, {
              buyerRating,
              buyerReview,
          });

          toast.success("Feedback submitted successfully!");
          // Optionally refetch order to update UI or hide the form
          // refetch(); // Assuming refetch is available from useQuery
          setShowFeedbackForm(false); // Hide the form after submission
          // You might want to update the local order state to reflect the feedback
          // setOrder({...order, buyerRating, buyerReview, deliveryApproved: true}); // Assuming feedback submission implies approval
          setShowReviewSuccessMessage(true); // Show success message

      } catch (error) {
          console.error("Feedback submission failed:", error);
          toast.error(error?.response?.data?.message || "Failed to submit feedback.");
      }
  };

  const renderProgressPhase = () => {
    switch (order.currentPhase) {
      case 'requirements':
        return (
          <div className="progress-phase requirements">
            <h3>Phase 1: Requirements and Attachments</h3>
            {order.phaseDetails.requirements.submitted ? (
              <div className="phase-content">
                <p>✓ Requirements submitted on {new Date(order.phaseDetails.requirements.submittedAt).toLocaleString()}</p>
                {order.phaseDetails.requirements.files.length > 0 && (
                  <div className="files-list">
                    <h4>Attached Files:</h4>
                    <ul>
                      {order.phaseDetails.requirements.files.map((file, index) => (
                        <li key={index}><a href={file} target="_blank" rel="noopener noreferrer">File {index + 1}</a></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p>Waiting for requirements submission...</p>
            )}
          </div>
        );

      case 'in_progress':
        return (
          <div className="progress-phase in-progress">
            <h3>Phase 2: Order in Progress</h3>
            <div className="phase-content">
              <p>✓ Requirements submitted</p>
              <p>✓ Order started on {new Date(order.phaseDetails.inProgress.startedAt).toLocaleString()}</p>
              <p>Last updated: {new Date(order.phaseDetails.inProgress.lastUpdated).toLocaleString()}</p>
              <p>Waiting for seller response...</p>
            </div>
          </div>
        );

      case 'delivered':
        return (
          <div className="progress-phase delivered">
            <h3>Phase 3: Order Delivered</h3>
            <div className="phase-content">
              <p>✓ Requirements submitted</p>
              <p>✓ Order completed</p>
              <p>✓ Delivered on {new Date(order.phaseDetails.delivered.deliveredAt).toLocaleString()}</p>
              {order.phaseDetails.delivered.deliveryImage && (
                <div className="delivery-image">
                  <img src={order.phaseDetails.delivered.deliveryImage} alt="Delivery confirmation" />
                </div>
              )}
              {/* Display seller's delivery notes */}
              {order.deliveryNotes && (
                <div className="delivery-notes">
                  <h4>Delivery Notes:</h4>
                  <p>{order.deliveryNotes}</p>
                </div>
              )}
              {/* Display attached delivery files */}
              {order.deliveryFiles && order.deliveryFiles.length > 0 && (
                <div className="delivery-files">
                  <h4>Attached Files:</h4>
                  <ul>
                    {order.deliveryFiles.map((fileUrl, index) => (
                      <li key={index}><a href={fileUrl} target="_blank" rel="noopener noreferrer">Delivered File {index + 1}</a></li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="delivery-message">{order.phaseDetails.delivered.deliveryMessage || "Your order has been successfully delivered!"}</p>

              {order.gigID && (
                <p className="revision-count">
                  Revisions: {revisionsUsed} of {totalRevisionsAllowed} used
                </p>
              )}

              {/* Add Buyer Action Buttons */}
              {!order.deliveryApproved && !showFeedbackForm && !showRevisionRequestForm && (
                <div className="buyer-actions">
                  <h4>What do you want to do?</h4>
                  <button className="approve-button" onClick={handleApproveDelivery}>Yes, I approved delivery</button>
                  <button className="request-revision-button" onClick={handleNotReady} disabled={!hasRevisionsLeft}>
                    {!hasRevisionsLeft ? "No Revisions Left" : "I want another revision"}
                  </button>
                </div>
              )}

              {/* Revision Request Form (Conditionally displayed) */}
              {showRevisionRequestForm && hasRevisionsLeft && (
                <div className="revision-request-form">
                  <h4>Request a Revision</h4>
                  <div className="form-group">
                    <label htmlFor="revision-message">What changes would you like? ({totalRevisionsAllowed - revisionsUsed} revisions remaining)</label>
                    <textarea
                      id="revision-message"
                      rows="5"
                      placeholder="Describe your requested changes here..."
                      value={revisionRequestMessage}
                      onChange={(e) => setRevisionRequestMessage(e.target.value)}
                    ></textarea>
                  </div>
                  <div className="form-group">
                    <label htmlFor="revision-attach-files">Attach files (optional):</label>
                    <input type="file" id="revision-attach-files" multiple onChange={handleRevisionFileChange} />
                    {selectedRevisionFiles.length > 0 && (
                      <span>{selectedRevisionFiles.length} file(s) selected</span>
                    )}
                  </div>
                  <button onClick={handleSendRevisionRequest} disabled={!revisionRequestMessage.trim() && selectedRevisionFiles.length === 0}>
                    Send Revision Request
                  </button>
                </div>
              )}

              {!hasRevisionsLeft && !showFeedbackForm && !showRevisionRequestForm && (
                <p className="no-revisions-left-message">You have used all your allowed revisions for this order.</p>
              )}

              {/* Feedback Form (Conditionally displayed) */}
              {showFeedbackForm && (
                  <div className="feedback-form">
                      <h4>Leave a Rating and Review</h4>
                      <div className="form-group">
                          <label htmlFor="rating">Rating:</label>
                          <div className="star-rating">
                              {[...Array(5)].map((star, index) => {
                                  index += 1;
                                  return (
                                      <img
                                          key={index}
                                          src={index <= (hoverRating || buyerRating) ? "/media/star.png" : "/media/placeholder-empty-star.png"}
                                          alt={`${index} star rating`}
                                          className="star"
                                          onClick={() => setBuyerRating(index)}
                                          onMouseEnter={() => setHoverRating(index)}
                                          onMouseLeave={() => setHoverRating(buyerRating)}
                                      />
                                  );
                              })}
                          </div>
                      </div>
                      <div className="form-group">
                          <label htmlFor="review">Review:</label>
                          <textarea
                              id="review"
                              rows="5"
                              placeholder="Write your review here..."
                              value={buyerReview}
                              onChange={(e) => setBuyerReview(e.target.value)}
                          ></textarea>
                      </div>
                      <button onClick={handleSubmitFeedback}>Submit Feedback</button>
                  </div>
              )}

              {/* Review Submitted Successfully Message (Conditionally displayed) */}
              {showReviewSuccessMessage && !showFeedbackForm && (
                <div className="review-success-message">
                  <h3>Review Submitted Successfully!</h3>
                  <p>Thank you for your feedback. We appreciate your input!</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return <p>Unknown order phase</p>;
    }
  };

  return (
    <div className="delivery">
      <div className="container">
        <h1>Order #{order._id}</h1>
        {order.commission && order.price && (
          <p style={{ fontWeight: 500, color: '#1dbf73', marginBottom: 10 }}>
            Commission ({((order.commission / order.price) * 100).toFixed(0)}%): {order.commission.toLocaleString('en-IN', { maximumFractionDigits: 0, style: 'currency', currency: 'INR' })}
          </p>
        )}
        <div className="progress-tracker">
          {renderProgressPhase()}
        </div>
      </div>
    </div>
  );
};

export default Delivery; 