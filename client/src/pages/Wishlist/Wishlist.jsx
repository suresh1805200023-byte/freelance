import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosFetch } from '../../utils';
import { Link } from 'react-router-dom';
import { Loader } from '../../components';
import toast from 'react-hot-toast';
import './Wishlist.scss';
import { useRecoilValue } from 'recoil';
import { userState } from '../../atoms';

const Wishlist = () => {
  const user = useRecoilValue(userState);

  const { isLoading, error, data: wishlist, refetch } = useQuery({
    queryKey: ['wishlist', user?._id],
    queryFn: () =>
      axiosFetch.get('/users/wishlist')
        .then(({ data }) => data.wishlist)
        .catch((err) => {
          toast.error(err?.response?.data?.message || 'Failed to fetch wishlist');
          throw err; // Re-throw to let react-query handle it
        }),
    enabled: !!user, // Only fetch if user is logged in
  });

  const handleRemoveFromWishlist = async (gigId) => {
    try {
      await axiosFetch.delete(`/users/wishlist/${gigId}`);
      toast.success("Gig removed from wishlist!");
      refetch(); // Refetch wishlist to update UI
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to remove gig from wishlist.");
      console.error("Remove from wishlist failed:", error);
    }
  };

  if (!user) {
    return <div className="wishlist-message">Please log in to view your wishlist.</div>;
  }

  if (isLoading) {
    return <div className="loader"><Loader /></div>;
  }

  if (error) {
    return <div className="error-message">Error loading wishlist.</div>;
  }

  if (!wishlist || wishlist.length === 0) {
    return <div className="wishlist-message">Your wishlist is empty. Add some gigs to see them here!</div>;
  }

  return (
    <div className="wishlist">
      <div className="container">
        <h1>My Wishlist</h1>
        <div className="wishlist-items">
          {wishlist.map((gig) => (
            <div className="wishlist-item" key={gig._id}>
              <Link to={`/gig/${gig._id}`} className="link">
                <img src={gig.cover} alt={gig.title} className="gig-cover" />
                <div className="item-details">
                  <h3>{gig.title}</h3>
                  <p>{gig.shortDesc}</p>
                  <span className="gig-price">{gig.price.toLocaleString('en-IN', { maximumFractionDigits: 0, style: 'currency', currency: 'INR' })}</span>
                </div>
              </Link>
              <button className="remove-button" onClick={() => handleRemoveFromWishlist(gig._id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wishlist; 