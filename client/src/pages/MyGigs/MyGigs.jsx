import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { axiosFetch } from '../../utils';
import { useRecoilValue } from 'recoil';
import { userState } from '../../atoms';
import { Loader } from '../../components';
import './MyGigs.scss';

const MyGigs = () => {
  const user = useRecoilValue(userState);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('gigs');

  const queryClient = useQueryClient();
  const { isLoading: isGigsLoading, error: gigsError, data: gigs } = useQuery({
    queryKey: ['my-gigs', user?._id],
    queryFn: () =>
      axiosFetch(`/gigs?userID=${user._id}`)
        .then(({ data }) => {
          console.log("Gigs data from backend:", data);
          return data;
        })
        .catch(({ response }) => {
          console.log(response.data);
        }),
    enabled: !!user && !!user._id,
  });

  const mutation = useMutation({
    mutationFn: (_id) =>
      axiosFetch.delete(`/gigs/${_id}`)
    ,
    onSuccess: () =>
      queryClient.invalidateQueries(['my-gigs'])
  });

  const sendForApprovalMutation = useMutation({
    mutationFn: (_id) => axiosFetch.patch(`/gigs/send-for-approval/${_id}`),
    onSuccess: () => {
      toast.success('Gig sent for approval!');
      queryClient.invalidateQueries(['my-gigs']);
    },
    onError: () => toast.error('Failed to send for approval'),
  });

  const handleGigDelete = (gig) => {
    mutation.mutate(gig._id);
    toast.success(gig.title + ' deleted successfully!');
  }

  const { isLoading: isOrdersLoading, error: ordersError, data: orders } = useQuery({
    queryKey: ['myOrders'],
    queryFn: () =>
      axiosFetch.get('/orders')
        .then(({ data }) => data)
        .catch((err) => {
          console.error("Error fetching orders:", err);
          throw err;
        })
  });

  const calculateEarnings = () => {
    if (!orders) return { total: 0, thisMonth: 0, thisWeek: 0 };
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    
    return orders.reduce((acc, order) => {
      if (order.isCompleted && order.sellerEarnings) {
        acc.total += order.sellerEarnings;
        
        const orderDate = new Date(order.createdAt);
        if (orderDate >= startOfMonth) {
          acc.thisMonth += order.sellerEarnings;
        }
        if (orderDate >= startOfWeek) {
          acc.thisWeek += order.sellerEarnings;
        }
      }
      return acc;
    }, { total: 0, thisMonth: 0, thisWeek: 0 });
  };

  const earnings = calculateEarnings();

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  if (isGigsLoading || isOrdersLoading) {
    return <div className="loader"><Loader /></div>;
  }

  if (gigsError || ordersError) {
    return <div className="error">Something went wrong!</div>;
  }

  return (
    <div className='myGigs'>
      <div className='container'>
        <div className='title'>
          <h1>My Gigs</h1>
          <Link to='/organize' className='link'>
            <button>Add New Gig</button>
          </Link>
        </div>

        <div className='earnings-summary'>
          <h2>Earnings Summary</h2>
          <div className='earnings-cards'>
            <div className='earnings-card'>
              <h3>Total Earnings</h3>
              <p>{earnings.total.toLocaleString('en-IN', { maximumFractionDigits: 0, style: 'currency', currency: 'INR' })}</p>
            </div>
            <div className='earnings-card'>
              <h3>This Month</h3>
              <p>{earnings.thisMonth.toLocaleString('en-IN', { maximumFractionDigits: 0, style: 'currency', currency: 'INR' })}</p>
            </div>
            <div className='earnings-card'>
              <h3>This Week</h3>
              <p>{earnings.thisWeek.toLocaleString('en-IN', { maximumFractionDigits: 0, style: 'currency', currency: 'INR' })}</p>
            </div>
          </div>
        </div>

        <div className='tabs'>
          <button 
            className={activeTab === 'gigs' ? 'active' : ''} 
            onClick={() => setActiveTab('gigs')}
          >
            My Gigs
          </button>
          <button 
            className={activeTab === 'orders' ? 'active' : ''} 
            onClick={() => setActiveTab('orders')}
          >
            My Orders
          </button>
        </div>

        {activeTab === 'gigs' ? (
          <div className='gigs'>
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Price</th>
                  <th>Sales</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {gigs?.map((gig) => (
                  <tr key={gig._id} onClick={() => navigate(`/gig/${gig._id}`)}>
                    <td>
                      <img
                        className="cover"
                        src={gig.cover}
                        alt=""
                      />
                    </td>
                    <td>{gig.title}</td>
                    <td>{gig.price.toLocaleString("en-IN", {
                      maximumFractionDigits: 0,
                      style: "currency",
                      currency: "INR",
                    })}</td>
                    <td>{gig.sales}</td>
                    <td>
                      <img className='delete' src="./media/delete.png" alt="delete" onClick={() => handleGigDelete(gig)} />
                      {gig.status !== 'approved' && (
                        <button style={{marginLeft: 8, background: '#f39c12', color: 'white', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer'}} onClick={e => {e.stopPropagation(); sendForApprovalMutation.mutate(gig._id);}} disabled={sendForApprovalMutation.isLoading}>
                          {gig.status === 'pending_approval' ? 'Pending Approval' : 'Send for Approval'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className='orders'>
            {orders?.map((order) => (
              <div className='order' key={order._id}>
                <div className='order-info'>
                  <h3>{order.title}</h3>
                  <p>Price: {order.price.toLocaleString('en-IN', { maximumFractionDigits: 0, style: 'currency', currency: 'INR' })}</p>
                  <p>Your Earnings: {order.sellerEarnings.toLocaleString('en-IN', { maximumFractionDigits: 0, style: 'currency', currency: 'INR' })}</p>
                  <p>Status: {order.isCompleted ? 'Completed' : 'In Progress'}</p>
                </div>
                <Link to={`/seller/orders/${order._id}`} className='link'>
                  <button>View Details</button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyGigs