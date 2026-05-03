import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosFetch } from '../../utils';
import toast from 'react-hot-toast';
import './GigApproval.scss';

const GigApproval = () => {
  const queryClient = useQueryClient();
  const [selectedGig, setSelectedGig] = useState(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ['pending-approval-gigs'],
    queryFn: () => axiosFetch.get('/gigs/pending-approval').then(res => res.data.gigs),
  });

  const approveMutation = useMutation({
    mutationFn: (_id) => axiosFetch.patch(`/gigs/approve/${_id}`),
    onSuccess: () => {
      toast.success('Gig approved!');
      queryClient.invalidateQueries(['pending-approval-gigs']);
      setSelectedGig(null);
    },
    onError: () => toast.error('Failed to approve gig'),
  });

  const rejectMutation = useMutation({
    mutationFn: (_id) => axiosFetch.patch(`/gigs/reject/${_id}`),
    onSuccess: () => {
      toast.success('Gig rejected!');
      queryClient.invalidateQueries(['pending-approval-gigs']);
      setSelectedGig(null);
    },
    onError: () => toast.error('Failed to reject gig'),
  });

  if (isLoading) return <div>Loading pending gigs...</div>;
  if (error) return <div>Error loading gigs for approval.</div>;

  return (
    <div className="gig-approval-page">
      <h2>Gig Approval (Admin Only)</h2>
      {data && data.length === 0 ? (
        <p>No gigs pending approval.</p>
      ) : (
        <table className="gig-approval-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Seller</th>
              <th>Category</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map(gig => (
              <tr key={gig._id}>
                <td>{gig.title}</td>
                <td>{gig.userID?.username}</td>
                <td>{gig.category}</td>
                <td>{gig.price}</td>
                <td className="action-cell">
                  <div className="gig-actions">
                    <button className="view-btn" onClick={() => setSelectedGig(gig)}>View</button>
                    <button className="approve-btn" onClick={() => approveMutation.mutate(gig._id)} disabled={approveMutation.isLoading}>Approve</button>
                    <button className="reject-btn" onClick={() => rejectMutation.mutate(gig._id)} disabled={rejectMutation.isLoading}>Reject</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Modal for full gig details */}
      {selectedGig && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-button" onClick={() => setSelectedGig(null)}>×</button>
            <h2 className="gig-title-modal">{selectedGig.title}</h2>
            <div className="gig-details-section">
              <p><b>Seller:</b> {selectedGig.userID?.username}</p>
              <p><b>Category:</b> {selectedGig.category}</p>
              <p><b>Price:</b> {selectedGig.price}</p>
            </div>
            <div className="gig-description-section">
              <h3>Description</h3>
              <p>{selectedGig.description}</p>
            </div>
            <div className="gig-meta-section">
              <p><b>Short Title:</b> {selectedGig.shortTitle}</p>
              <p><b>Short Description:</b> {selectedGig.shortDesc}</p>
              <p><b>Delivery Time:</b> {selectedGig.deliveryTime}</p>
              <p><b>Revision Number:</b> {selectedGig.revisionNumber}</p>
            </div>
            <div className="gig-features-section">
              <h3>Features</h3>
              <ul>
                {selectedGig.features?.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
            <div className="gig-images-section">
              <h3>Images</h3>
              <div className="image-gallery">
                {selectedGig.cover && <img src={selectedGig.cover} alt="cover" className="gig-image" />}
                {selectedGig.images?.map((img, i) => <img key={i} src={img} alt={`gig-img-${i}`} className="gig-image" />)}
              </div>
            </div>
            <div className="modal-actions">
              <button className="approve-button" onClick={() => approveMutation.mutate(selectedGig._id)} disabled={approveMutation.isLoading}>Approve & Publish</button>
              <button className="reject-button" onClick={() => rejectMutation.mutate(selectedGig._id)} disabled={rejectMutation.isLoading}>Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GigApproval; 