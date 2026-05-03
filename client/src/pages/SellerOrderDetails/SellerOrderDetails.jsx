import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { axiosFetch } from '../../utils';
import { Loader } from '../../components';
import toast from 'react-hot-toast';
import { generateImageURL } from '../../utils';
import './SellerOrderDetails.scss';

const SellerOrderDetails = () => {
  const { orderId } = useParams();
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [selectedDeliveryFiles, setSelectedDeliveryFiles] = useState([]);
  const [isUploadingDeliveryFiles, setIsUploadingDeliveryFiles] = useState(false);
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false);
  const [showRevisionHistory, setShowRevisionHistory] = useState(false);

  const { isLoading, error, data: order, refetch: refetchOrder } = useQuery({
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (isLoading) {
    return <div className="loader"><Loader /></div>;
  }

  if (error) {
    return <div className="error-message">Error loading order details.</div>;
  }

  if (!order) {
      return <div className="not-found">Order not found.</div>;
  }

  const handleDeliveryFileChange = (event) => {
    setSelectedDeliveryFiles([...event.target.files]);
  };

  const handleDeliverySubmit = async () => {
      if (!deliveryNotes.trim() && selectedDeliveryFiles.length === 0) {
          toast.error("Please provide delivery notes or attach files.");
          return;
      }

      setIsSubmittingDelivery(true);
      let uploadedDeliveryFileUrls = [];

      if (selectedDeliveryFiles.length > 0) {
          setIsUploadingDeliveryFiles(true);
          toast("Uploading delivery files...");
          try {
              uploadedDeliveryFileUrls = await Promise.all(
                  selectedDeliveryFiles.map(async (file) => {
                      const uploadResponse = await generateImageURL(file);
                      return uploadResponse.url;
                  })
              );
              toast.success("Delivery files uploaded successfully!");
          } catch (uploadError) {
              console.error("Delivery file upload failed:", uploadError);
              toast.error("Delivery file upload failed.");
              setIsUploadingDeliveryFiles(false);
              setIsSubmittingDelivery(false);
              return;
          } finally {
              setIsUploadingDeliveryFiles(false);
          }
      }

      try {
          // TODO: Create a new backend endpoint to handle delivery submission
          // Send order ID, delivery notes, and uploaded file URLs to the backend
          console.log("Submitting delivery:", deliveryNotes, uploadedDeliveryFileUrls);
          // Example API call (replace with your actual endpoint):
          // await axiosFetch.post(`/orders/${order._id}/delivery`, {
          //   deliveryNotes: deliveryNotes,
          //   deliveryFiles: uploadedDeliveryFileUrls,
          // });

          await axiosFetch.post(`/orders/${order._id}/delivery`, {
            deliveryNotes: deliveryNotes,
            deliveryFiles: uploadedDeliveryFileUrls,
          });

          toast.success("Delivery submitted successfully!");
          // Optionally refetch order to update UI
          refetchOrder();

      } catch (submitError) {
          console.error("Delivery submission failed:", submitError);
          toast.error("Delivery submission failed.");
      } finally {
          setIsSubmittingDelivery(false);
      }
  };

  const renderProgressPhase = () => {
    switch (order.currentPhase) {
      case 'requirements':
        return (
          <div className="progress-phase requirements">
            <h3>Phase 1: Requirements and Attachments</h3>
            {order.requirementsSubmitted ? (
              <div className="phase-content">
                <p>✓ Requirements submitted on {new Date(order.phaseDetails.requirements.submittedAt).toLocaleString()}</p>
                {order.requirements && (
                  <div className="requirements-text">
                    <h4>Buyer Requirements:</h4>
                    <p>{order.requirements}</p>
                  </div>
                )}
                {order.requirementsFiles && order.requirementsFiles.length > 0 && (
                  <div className="files-list">
                    <h4>Attached Files:</h4>
                    <ul>
                      {order.requirementsFiles.map((file, index) => (
                        <li key={index}><a href={file} target="_blank" rel="noopener noreferrer">File {index + 1}</a></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p>Waiting for buyer to submit requirements.</p>
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
              {/* Seller's delivery upload form */}
              {!order.isDelivered && (
                <div className="delivery-section">
                  <h3>Deliver Work</h3>
                  <div className="delivery-upload-form">
                      <textarea
                          placeholder="Add delivery notes here..."
                          value={deliveryNotes}
                          onChange={(e) => setDeliveryNotes(e.target.value)}
                          disabled={isSubmittingDelivery || isUploadingDeliveryFiles}
                      ></textarea>
                      <input
                          type="file"
                          multiple
                          onChange={handleDeliveryFileChange}
                          disabled={isSubmittingDelivery || isUploadingDeliveryFiles}
                      />
                      {selectedDeliveryFiles.length > 0 && (
                        <span>{selectedDeliveryFiles.length} file(s) selected</span>
                      )}
                      <button
                          onClick={handleDeliverySubmit}
                          disabled={!deliveryNotes.trim() && selectedDeliveryFiles.length === 0 || isSubmittingDelivery || isUploadingDeliveryFiles}
                      >
                          {isSubmittingDelivery ? 'Submitting...' : isUploadingDeliveryFiles ? 'Uploading Files...' : 'Submit Delivery'}
                      </button>
                  </div>
                </div>
              )}
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
              {order.deliveryNotes && (
                <div className="delivery-notes">
                  <h4>Delivery Notes:</h4>
                  <p>{order.deliveryNotes}</p>
                </div>
              )}
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
              <p className="delivery-message">{order.phaseDetails.delivered.deliveryMessage || "Order successfully delivered."}</p>
            </div>
          </div>
        );

      default:
        return <p>Unknown order phase</p>;
    }
  };

  return (
    <div className="seller-order-details">
      <div className="container">
        <h1>Order #{order._id}</h1>
        <div className="order-info">
            <p><strong>Gig Title:</strong> {order.title}</p>
            <p><strong>Buyer:</strong> {order.buyerID.username}</p>
            <p><strong>Total Price:</strong> {order.price ? order.price.toLocaleString('en-IN', { maximumFractionDigits: 0, style: 'currency', currency: 'INR' }) : '-'}</p>
            <p><strong>Commission (10%):</strong> {order.price ? (order.price * 0.1).toLocaleString('en-IN', { maximumFractionDigits: 0, style: 'currency', currency: 'INR' }) : '-'}</p>
            <p><strong>Your Earnings (90%):</strong> {order.price ? (order.price * 0.9).toLocaleString('en-IN', { maximumFractionDigits: 0, style: 'currency', currency: 'INR' }) : '-'}</p>
        </div>

        {/* Display Order Progress based on currentPhase */}
        <div className="progress-tracker">
          {renderProgressPhase()}
        </div>

        {/* Display Buyer Feedback (remains outside progress phases) */}
        {order.deliveryApproved && (
            <div className="buyer-feedback-display">
                <h3>Buyer Feedback:</h3>
                <div className="rating-display">
                    <strong>Rating:</strong> {order.buyerRating} / 5
                </div>
                {order.buyerReview && (
                    <div className="review-display">
                        <strong>Review:</strong> {order.buyerReview}
                    </div>
                )}
            </div>
        )}

        {/* Display Revision Request (remains outside progress phases if not in current phase) */}
        {order.revisionRequested && order.currentPhase !== 'delivered' && (
            <div className="revision-status">
                <h3>Revision Requested by Buyer</h3>
                <p>The buyer has requested a revision. Please review their feedback and upload a revised delivery.</p>

                {order.revisionDetails && order.revisionDetails.length > 0 && (
                    <div className="revision-history-toggle">
                        <button onClick={() => setShowRevisionHistory(!showRevisionHistory)}>
                            {showRevisionHistory ? 'Hide Revision History' : `View Revision History (${order.revisionDetails.length})`}
                        </button>
                    </div>
                )}

                {showRevisionHistory && order.revisionDetails && order.revisionDetails.length > 0 && (
                    <div className="revision-details-list">
                        {order.revisionDetails.map((revision, index) => (
                            <div key={index} className="revision-details-item">
                                <strong>Revision #{index + 1}:</strong>
                                <p>{revision.message}</p>
                                <small>Requested on: {new Date(revision.timestamp).toLocaleString()}</small>
                            </div>
                        ))}
                    </div>
                )}

                {order.revisionFiles && order.revisionFiles.length > 0 && (
                    <div className="revision-files">
                        <h4>Attached Revision Files:</h4>
                        <ul>
                            {order.revisionFiles.map((fileUrl, index) => (
                                <li key={index}><a href={fileUrl} target="_blank" rel="noopener noreferrer">Revision File {index + 1}</a></li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        )}

      </div>
    </div>
  );
};

export default SellerOrderDetails; 