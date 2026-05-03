import toast from 'react-hot-toast';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosFetch, getCountryFlag, generateImageURL } from '../../utils';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Loader, NextArrow, PrevArrow } from '../../components';
import './Gig.scss';
import { useRecoilValue } from 'recoil';
import { userState } from '../../atoms';
import { useState } from 'react';

import { CarouselProvider, Slider, Slide, ImageWithZoom, ButtonBack, ButtonNext, Image } from 'pure-react-carousel';
import 'pure-react-carousel/dist/react-carousel.es.css';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

const Gig = () => {
  const { _id } = useParams();
  const user = useRecoilValue(userState);
  const [requirements, setRequirements] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isSubmittingRequirements, setIsSubmittingRequirements] = useState(false);
  const [showFeedbackOptions, setShowFeedbackOptions] = useState(true);
  const [showRatingReviewForm, setShowRatingReviewForm] = useState(false);
  const [showRevisionRequestButton, setShowRevisionRequestButton] = useState(false);
  const [showFeedbackSuccessMessage, setShowFeedbackSuccessMessage] = useState(false);
  const [showRevisionRequestedMessage, setShowRevisionRequestedMessage] = useState(false);
  const navigate = useNavigate();
  const [buyerRating, setBuyerRating] = useState(0);
  const [buyerReview, setBuyerReview] = useState('');
  const [revisionDetailsText, setRevisionDetailsText] = useState('');
  const [isUpdatingPaymentStatus, setIsUpdatingPaymentStatus] = useState(false);
  const [showThankYouBanner, setShowThankYouBanner] = useState(false);
  const [requirementsChecked, setRequirementsChecked] = useState(false);

  // Fetch user's wishlist
  const { data: wishlist, refetch: refetchWishlist, isLoading: isWishlistLoading } = useQuery({
    queryKey: ['wishlist', user?._id],
    queryFn: () => axiosFetch.get('/users/wishlist').then(({ data }) => data.wishlist),
    enabled: !!user, // Only fetch if user is logged in
  });

  const isGigInWishlist = wishlist?.some((item) => item._id === _id) || false;

  const handleAddToWishlist = async () => {
    if (!user) {
      toast.error("Please log in to add to wishlist.");
      return;
    }
    try {
      await axiosFetch.post(`/users/wishlist/${_id}`);
      toast.success("Gig added to wishlist!");
      refetchWishlist(); // Refetch wishlist to update UI
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to add gig to wishlist.");
      console.error("Add to wishlist failed:", error);
    }
  };

  const handleRemoveFromWishlist = async () => {
    if (!user) {
      toast.error("Please log in to remove from wishlist.");
      return;
    }
    try {
      await axiosFetch.delete(`/users/wishlist/${_id}`);
      toast.success("Gig removed from wishlist!");
      refetchWishlist(); // Refetch wishlist to update UI
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to remove gig from wishlist.");
      console.error("Remove from wishlist failed:", error);
    }
  };

  const { isLoading, error, data } = useQuery({
    queryKey: ['gig'],
    queryFn: () =>
      axiosFetch.get(`/gigs/single/${_id}`)
        .then(({ data }) => {
          data.images.unshift(data.cover);
          console.log("User data from backend:", data?.userID);
          return data;
        })
        .catch(({ response }) => {
          toast.error(response.data.message);
        })
  });

  // Fetch single order for this gig and user
  const { isLoading: isOrderLoading, error: orderError, data: orderData, refetch: refetchOrder } = useQuery({
    queryKey: ['order', _id, user?._id],
    queryFn: () =>
      axiosFetch.get(`/orders/single/${_id}`)
        .then(({ data }) => {
          console.log("Gig.jsx - orderData fetched:", data); // Added for debugging
          return data;
        })
        .catch((err) => {
          console.error("Gig.jsx - order fetch error:", err); // Added for debugging
          if (err.response && err.response.status === 404) {
            return null; // No order found, which is expected if the gig hasn't been purchased
          } else {
            console.error("Error fetching order:", err);
            throw err; // Re-throw other errors
          }
        }),
    enabled: !!user && !!_id, // Only run this query if user and gig ID are available
  });

  const queryClient = useQueryClient(); // Initialize useQueryClient

  useEffect(() => {
    console.log("Gig.jsx - useEffect triggered. orderData:", orderData, "isOrderLoading:", isOrderLoading); // Added for debugging
    // Check if the URL contains payment success parameters
    const queryParams = new URLSearchParams(window.location.search);
    const redirectStatus = queryParams.get('redirect_status');
    const paymentIntentId = queryParams.get('payment_intent');

    if (redirectStatus === 'succeeded' && paymentIntentId && user && _id &&
        (!orderData || (orderData && !orderData.isCompleted)) && !isUpdatingPaymentStatus) {
      console.log("Gig.jsx - Payment succeeded, updating payment status and refetching order..."); // Added for debugging
      setIsUpdatingPaymentStatus(true);
      axiosFetch.patch('/orders/', { payment_intent: paymentIntentId })
        .then(() => {
          toast.success("Order payment confirmed!");
          queryClient.invalidateQueries(['order']); // Invalidate and refetch order data
          refetchOrder(); // Explicitly refetch to ensure immediate update
          queryClient.invalidateQueries(['gig']); // Invalidate gig data to show new reviews
        })
        .catch((err) => {
          console.error("Error updating payment status:", err);
          toast.error("Failed to confirm payment status.");
        })
        .finally(() => {
          setIsUpdatingPaymentStatus(false);
          setShowThankYouBanner(true); // Show banner on successful payment confirmation
          // Clean the URL to remove Stripe parameters after handling them
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('payment_intent');
          newUrl.searchParams.delete('payment_intent_client_secret');
          newUrl.searchParams.delete('redirect_status');
          window.history.replaceState({}, document.title, newUrl.pathname + newUrl.search);
        });
    } else if (redirectStatus === 'succeeded' && user && _id && orderData && orderData.isCompleted) {
      // If already completed and just redirected, show banner immediately
      setShowThankYouBanner(true);
       // Clean the URL to remove Stripe parameters after handling them
       const newUrl = new URL(window.location.href);
       newUrl.searchParams.delete('payment_intent');
       newUrl.searchParams.delete('payment_intent_client_secret');
       newUrl.searchParams.delete('redirect_status');
       window.history.replaceState({}, document.title, newUrl.pathname + newUrl.search);
    }
    window.scrollTo(0, 0)
  }, [user, _id, refetchOrder, orderData, isOrderLoading, isUpdatingPaymentStatus, queryClient]);

  const country = getCountryFlag(data?.userID.country);

  const handleFileChange = (event) => {
    setSelectedFiles([...event.target.files]);
  };

  const handleSubmitRequirements = async () => {
    if (!requirements.trim()) {
      toast.error("Please provide your requirements.");
      return;
    }

    setIsSubmittingRequirements(true);
    let uploadedFileUrls = [];

    if (selectedFiles.length > 0) {
      setIsUploadingFiles(true);
      toast("Uploading files...");
      try {
        uploadedFileUrls = await Promise.all(
          selectedFiles.map(async (file) => {
            const uploadResponse = await generateImageURL(file);
            return uploadResponse.url;
          })
        );
        toast.success("Files uploaded successfully!");
      } catch (uploadError) {
        console.error("File upload failed:", uploadError);
        toast.error("File upload failed.");
        setIsUploadingFiles(false);
        setIsSubmittingRequirements(false);
        return;
      } finally {
        setIsUploadingFiles(false);
      }
    }

    try {
      // TODO: Create a new backend endpoint to handle requirements submission
      // Send order ID, requirements text, and uploaded file URLs to the backend
      console.log("Submitting requirements:", requirements, uploadedFileUrls);
      // Example API call (replace with your actual endpoint):
      // await axiosFetch.post(`/orders/${order._id}/requirements`, {
      //   requirements: requirements,
      //   files: uploadedFileUrls,
      // });

      await axiosFetch.post(`/orders/${orderData._id}/requirements`, {
        requirements: requirements,
        files: uploadedFileUrls,
      });

      toast.success("Requirements submitted successfully!");
      // Optionally update local state to hide the form
      refetchOrder();

    } catch (submitError) {
      console.error("Requirements submission failed:", submitError);
      toast.error("Requirements submission failed.");
    } finally {
      setIsSubmittingRequirements(false);
    }
  };

  const handleSubmitFeedback = async () => {
    // Basic validation: require at least a 1-star rating
    if (buyerRating === 0) {
      toast.error("Please provide a rating.");
      return;
    }

    try {
      // API call to the backend to submit buyer feedback
      await axiosFetch.post(`/orders/${orderData._id}/feedback`, {
        buyerRating,
        buyerReview,
      });

      toast.success("Feedback submitted successfully!");
      // Update local state to reflect that the delivery has been approved and feedback submitted
      refetchOrder();
      // Hide the feedback forms and options
      setShowRatingReviewForm(false);
      setShowFeedbackSuccessMessage(true);

    } catch (error) {
      console.error("Feedback submission failed:", error);
      toast.error("Failed to submit feedback.");
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionDetailsText.trim()) {
      toast.error("Please provide details for the revision.");
      return;
    }

    try {
      // API call to the backend to request a revision
      await axiosFetch.post(`/orders/${orderData._id}/revision`, {
        revisionDetails: revisionDetailsText,
      });

      toast.success("Revision requested successfully!");
      // Update local state to reflect that the revision has been requested
      refetchOrder();
      setShowRevisionRequestedMessage(true);

    } catch (error) {
      console.error("Revision request failed:", error);
      toast.error("Failed to request revision.");
    }
  };

  return (
    <div className="gig">
      {
        isLoading || isOrderLoading || isUpdatingPaymentStatus
          ? <div className='loader'> <Loader /> </div>
          : error || orderError
            ? 'Something went wrong!'
            : <div className="container">
              {showThankYouBanner && (
                <div className="thank-you-banner">
                  <img src="/img/greencheck.png" alt="success" />
                  <span>Thank You for Your Purchase</span>
                  <p>A receipt was sent to your email address</p>
                  <button onClick={() => setShowThankYouBanner(false)} className="close-button">X</button>
                </div>
              )}
              <div className="left">
                <span className="breadcrumbs">Graphics & Design</span>
                
                <CarouselProvider
                  naturalSlideHeight={100}
                  naturalSlideWidth={125}
                  totalSlides={data?.images.length}
                  infinite
                  className='slider'
                >
                  <Slider >
                    {
                      data.images.map((img) => (
                        <Slide key={img}>
                          <Image key={img} src={img} alt='' />
                        </Slide>
                      ))
                    }
                  </Slider>

                    <ButtonBack>
                      <PrevArrow />
                    </ButtonBack>

                    <ButtonNext>
                      <NextArrow />
                    </ButtonNext>

                </CarouselProvider>
                <h1>{data?.title}</h1>
                <div className="user">
                  <img
                    className="pp"
                    src={data?.userID?.image || '/media/noavatar.png'}
                    alt=""
                  />
                  <span>{data?.userID.username}</span>
                  {/* Add average rating display */}
                  {data?.starNumber > 0 && (
                    <div className="stars">
                      {
                        new Array(Math.round(data.totalStars / data.starNumber))
                          .fill()
                          .map((item, i) => (
                            <img src="/media/star.png" key={i} alt="star" />
                          ))}
                      <span>{(data.totalStars / data.starNumber).toFixed(1)}</span>
                    </div>
                  )}

                  {user && !user.isSeller && ( // Only show wishlist icon for buyers
                    <div className="wishlist-icon">
                      <img
                        src={isGigInWishlist ? "/media/heart-filled.png" : "/media/heart-outline.png"}
                        alt="Add to Wishlist"
                        onClick={isGigInWishlist ? handleRemoveFromWishlist : handleAddToWishlist}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                  )}

                </div>
                
                <div className="right-mobile">
                  <div className="price">
                    <h3>{data?.shortTitle}</h3>
                    <h2>{data?.price.toLocaleString('en-IN', {
                      maximumFractionDigits: 0,
                      style: 'currency',
                      currency: 'INR',
                    })}</h2>
                  </div>
                  <p>
                    {data?.shortDesc}
                  </p>
                  <div className="details">
                    <div className="item">
                      <img src="/img/clock.png" alt="" />
                      <span>{data.deliveryTime} days Delivery</span>
                    </div>
                    <div className="item">
                      <img src="/img/recycle.png" alt="" />
                      <span>{data.revisionNumber} Revisions</span>
                    </div>
                  </div>
                  <div className="features">
                    {
                      data?.features.map((feature) => (
                        <div key={feature} className="item">
                          <img src="/img/greencheck.png" alt="" />
                          <span>{feature}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
                <h2>About This Gig</h2>
                <p>
                  {
                    data.description
                  }
                </p>
                {/* Requirements Submission Section (Conditionally displayed after purchase) */}
                {orderData && !orderData.requirementsSubmitted && user && !user.isSeller && (
                <div className="requirements-section">
                  <h2>Submit Requirements to Start Your Order</h2>
                  <div className="form-group">
                    <label htmlFor="requirements">1. Do you have an Idea of what you want? or should I surprise you?</label>
                    <textarea id="requirements" rows="10" placeholder="Describe your requirements here..." value={requirements} onChange={(e) => setRequirements(e.target.value)} disabled={isSubmittingRequirements || isUploadingFiles}></textarea>
                  </div>
                  <div className="form-group">
                    <label htmlFor="attach-files">2. You can attach Images you want me to Include In the Thumbnail (If you have) (optional)</label>
                    <input type="file" id="attach-files" multiple onChange={handleFileChange} disabled={isSubmittingRequirements || isUploadingFiles} />
                    {selectedFiles.length > 0 && (
                      <span>{selectedFiles.length} file(s) selected</span>
                    )}
                  </div>
                  <div className="form-group checkbox-group">
                    <input
                      type="checkbox"
                      id="requirements-check"
                      checked={requirementsChecked}
                      onChange={(e) => setRequirementsChecked(e.target.checked)}
                    />
                    <label htmlFor="requirements-check">The information I provided is accurate and complete. Any changes will require the seller's approval, and may be subject to additional costs.</label>
                  </div>
                  
                  {/* Submit Requirements Button (Visible before submission) */}
                  <button
                    onClick={handleSubmitRequirements}
                    disabled={!requirements.trim() || isSubmittingRequirements || isUploadingFiles || !requirementsChecked}
                  >
                    {isSubmittingRequirements ? 'Submitting...' : 'Start Order'}
                  </button>

                </div>
                )}
                {/* End Requirements Submission Section */}

                {/* Display Delivery Progress if order exists and requirements submitted */}
                {orderData && orderData.requirementsSubmitted && !orderData.isDelivered && user && !user.isSeller && (
                    <div className="delivery-progress-section">
                         <h2>Order Progress</h2>
                         {/* Here you would integrate the Delivery component or its logic */}
                         {/* For now, a simple message: */}
                         <p>Your order is in progress. View details on the <Link to={`/delivery/${orderData._id}`}>Delivery Page</Link>.</p>
                    </div>
                )}

                {/* Display Gig Delivered Successfully if order is delivered */}
                {orderData && orderData.isDelivered && user && !user.isSeller && (
                  <div className="gig-delivered-section">
                    <h2>Gig Delivered Successfully!</h2>
                    <p>Your gig has been delivered. You can view the delivery details on the <Link to={`/delivery/${orderData._id}`}>Delivery Page</Link>.</p>
                    {/* Optionally add a button to leave feedback if not already done */}
                  </div>
                )}

                <h2>Reviews</h2>
                <div className="reviews">
                  {
                    data?.reviews.length > 0 ? (
                      data.reviews.map((review) => (
                        <div className="item" key={review._id}>
                          <div className="user">
                            <img src={review.userID?.image || "/media/noavatar.png"} alt="" />
                            <div className="info">
                              <span>{review.userID?.username}</span>
                              <div className="country">
                                <img src={getCountryFlag(review.userID?.country)?.normal} alt="" />
                                <span>{review.userID?.country}</span>
                              </div>
                            </div>
                          </div>
                          <div className="stars">
                            {Array(review.star).fill().map((item, i) => (
                              <img src="/media/star.png" alt="" key={i} />
                            ))}
                            <span>{review.star}</span>
                          </div>
                          <p>{review.review}</p>

                          {review.sellerResponse && (
                            <div className="seller-response">
                              <h4>Seller's response</h4>
                              <p>{review.sellerResponse}</p>
                            </div>
                          )}

                          <div className="helpful">
                            <span>Helpful?</span>
                            <img src="/media/like.png" alt="" />
                            <span>Yes</span>
                            <img src="/media/dislike.png" alt="" />
                            <span>No</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p>No reviews yet for this gig.</p>
                    )
                  }
                </div>

                <div className="seller">
                  <h2>About The Seller</h2>
                  {/* Gamification Badges and XP */}
                  <div className="seller-gamification" style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '10px' }}>
                    {data?.userID?.orderMilestoneBadge && (
                      <span style={{ fontSize: '18px', fontWeight: 'bold', background: '#f0f8ff', borderRadius: '8px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {data.userID.orderMilestoneBadge === 'Starter Seller' && '🥉'}
                        {data.userID.orderMilestoneBadge === 'Rising Talent' && '🥈'}
                        {data.userID.orderMilestoneBadge === 'Top Performer' && '🥇'}
                        {data.userID.orderMilestoneBadge}
                      </span>
                    )}
                    {data?.userID?.xp !== undefined && (
                      <span style={{ fontSize: '16px', color: '#1dbf73', fontWeight: 'bold', background: '#e6fff3', borderRadius: '8px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        XP: {data.userID.xp}
                        {/* XP Badge */}
                        {(() => {
                          const xp = data.userID.xp;
                          if (xp <= 20) return <span title="Beginner" style={{marginLeft: 6}}>🎓</span>;
                          if (xp <= 50) return <span title="Getting Started" style={{marginLeft: 6}}>🚀</span>;
                          if (xp <= 75) return <span title="Active Seller" style={{marginLeft: 6}}>🔧</span>;
                          if (xp <= 100) return <span title="Rising Star" style={{marginLeft: 6}}>🌟</span>;
                          return null;
                        })()}
                      </span>
                    )}
                    {Array.isArray(data?.userID?.ratingBadges) && data.userID.ratingBadges.length > 0 && (
                      <span style={{ display: 'flex', gap: '10px' }}>
                        {data.userID.ratingBadges.map((badge, idx) => (
                          <span key={idx} style={{ fontSize: '16px', background: '#fffbe6', borderRadius: '8px', padding: '6px 14px', fontWeight: 'bold', color: '#ffc108', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {badge === 'Customer Favorite' && '🌟'}
                            {badge === 'Perfect 5' && '🎯'}
                            {badge}
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                  <div className="user">
                    <img
                      src={data?.userID?.image || '/media/noavatar.png'}
                      alt=""
                    />
                    <div className="info">
                      <span>{data?.userID.username}</span>
                      <span>Email: {data?.userID.email}</span>
                      <span>Phone: {data?.userID.phone ? data?.userID.phone : ''}</span>
                    </div>
                  </div>
                  <div className="box">
                    <div className="items">
                      <div className="item">
                        <span className="title">From</span>
                        <span className="desc">{data?.userID.country}
                          <span className='flag'>
                          <img src={country.normal} alt="" />
                          </span>
                        </span>
                      </div>
                      <div className="item">
                        <span className="title">Member since</span>
                        <span className="desc">{MONTHS[new Date(data?.userID.createdAt).getMonth()] + ' ' + new Date(data?.userID.createdAt).getFullYear()}</span>
                      </div>
                      <div className="item">
                        <span className="title">Avg. response time</span>
                        <span className="desc">4 hours</span>
                      </div>
                      <div className="item">
                        <span className="title">Last delivery</span>
                        <span className="desc">1 day</span>
                      </div>
                    </div>
                    <hr />
                    <p>
                      {data.userID.description}
                    </p>
                  </div>
                </div>
              </div>
              <div className="right">
                <div className="price">
                  <h3>{data?.shortTitle}</h3>
                  <h2>{data?.price.toLocaleString('en-IN', {
                    maximumFractionDigits: 0,
                    style: 'currency',
                    currency: 'INR',
                  })}</h2>
                </div>
                <p>
                  {data?.shortDesc}
                </p>
                <div className="details">
                  <div className="item">
                    <img src="/img/clock.png" alt="" />
                    <span>{data.deliveryTime} days Delivery</span>
                  </div>
                  <div className="item">
                    <img src="/img/recycle.png" alt="" />
                    <span>{data.revisionNumber} Revisions</span>
                  </div>
                </div>
                <div className="features">
                  {
                    data?.features.map((feature) => (
                      <div key={feature} className="item">
                        <img src="/img/greencheck.png" alt="" />
                        <span>{feature}</span>
                      </div>
                    ))
                  }
                </div>
                {user && !user.isSeller && !isOrderLoading && !isUpdatingPaymentStatus && !orderData && (
                  <button onClick={() => navigate(`/pay/${_id}`)} className="continue-to-delivery">
                    Continue to Delivery
                  </button>
                )}
              </div>
            </div>
      }
    </div>
  )
}

export default Gig