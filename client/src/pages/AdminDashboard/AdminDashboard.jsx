import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { axiosFetch } from '../../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader, AdminSidebar } from '../../components';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import GigApproval from './GigApproval';
import './AdminDashboard.scss';
import './AdminChartRect.css';

const AdminDashboard = () => {
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState('all'); // 'customers', 'sellers', 'all'
  const [isSending, setIsSending] = useState(false);
  const queryClient = useQueryClient();
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  const [chartTimePeriod, setChartTimePeriod] = useState('monthly'); // 'yearly', 'monthly', 'weekly', 'daily'
  const [commissionPercentage, setCommissionPercentage] = useState(10); // Default value
  const [newCategory, setNewCategory] = useState({ name: '', description: '', image: null });
  const [editingCategory, setEditingCategory] = useState(null);
  const [currentCategoryName, setCurrentCategoryName] = useState('');
  const [currentCategoryDesc, setCurrentCategoryDesc] = useState('');
  const [currentCategoryImage, setCurrentCategoryImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  // Add a new menu item for failed login attempts
  const failedLoginMenuKey = 'failedLogins';
  const reviewLegitimacyMenuKey = 'reviewLegitimacy';
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);

  const { isLoading: isUsersLoading, error: usersError, data: usersData } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () =>
      axiosFetch.get('/users')
        .then(({ data }) => data)
        .catch((err) => {
          console.error("Error fetching users:", err);
          throw err;
        }),
    enabled: activeMenuItem === 'users',
  });

  const { isLoading: isDashboardLoading, error: dashboardError, data: dashboardData } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: () =>
      axiosFetch.get('/admin/dashboard')
        .then(({ data }) => data.stats)
        .catch((err) => {
          console.error("Error fetching dashboard stats:", err);
          throw err;
        }),
    enabled: activeMenuItem === 'dashboard',
  });

  const { isLoading: isReviewsLoading, error: reviewsError, data: reviewsData } = useQuery({
    queryKey: ['allReviews'],
    queryFn: () =>
      axiosFetch.get('/reviews')
        .then(({ data }) => {
          console.log('Admin Reviews API response:', data);
          return data.reviews;
        })
        .catch((err) => {
          console.error("Error fetching reviews:", err);
          throw err;
        }),
    enabled: activeMenuItem === 'reviews',
  });

  const { isLoading: isDisputesLoading, error: disputesError, data: disputesData } = useQuery({
    queryKey: ['allDisputes'],
    queryFn: () =>
      axiosFetch.get('/disputes')
        .then(({ data }) => data.disputes)
        .catch((err) => {
          console.error("Error fetching disputes:", err);
          throw err;
        }),
    enabled: activeMenuItem === 'disputes',
  });

  const { isLoading: isCommissionLoading, error: commissionError, data: commissionData } = useQuery({
    queryKey: ['commission'],
    queryFn: () =>
      axiosFetch.get('/commission')
        .then(({ data }) => {
          setCommissionPercentage(data.commission.percentage);
          return data.commission;
        })
        .catch((err) => {
          console.error("Error fetching commission:", err);
          throw err;
        }),
    enabled: activeMenuItem === 'commission',
  });

  const { isLoading: isCategoriesLoading, error: categoriesError, data: categoriesData } = useQuery({
    queryKey: ['allCategories'],
    queryFn: () =>
      axiosFetch.get('/categories')
        .then(({ data }) => data.categories)
        .catch((err) => {
          console.error("Error fetching categories:", err);
          throw err;
        }),
    enabled: activeMenuItem === 'categories',
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId) =>
      axiosFetch.delete(`/reviews/${reviewId}`)
        .then(({ data }) => data)
        .catch((err) => {
          console.error("Error deleting review:", err);
          throw err;
        }),
    onSuccess: () => {
      queryClient.invalidateQueries(['allReviews']);
      toast.success("Review deleted successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to delete review: ${error.message}`);
    }
  });

  const handleDeleteReview = (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      deleteReviewMutation.mutate(reviewId);
    }
  };

  const updateUserStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }) =>
      axiosFetch.patch(`/users/${userId}/status`, { isActive })
        .then(({ data }) => data)
        .catch((err) => {
          console.error("Error updating user status:", err);
          throw err;
        }),
    onSuccess: () => {
      queryClient.invalidateQueries(['allUsers']);
      toast.success("User status updated!");
    },
    onError: (error) => {
      toast.error(`Failed to update user status: ${error.message}`);
    }
  });

  const handleUserStatusToggle = (userId, currentStatus) => {
    updateUserStatusMutation.mutate({ userId, isActive: !currentStatus });
  };

  const updateDisputeStatusMutation = useMutation({
    mutationFn: ({ disputeId, status }) =>
      axiosFetch.put(`/disputes/${disputeId}/status`, { status })
        .then(({ data }) => data)
        .catch((err) => {
          console.error("Error updating dispute status:", err);
          throw err;
        }),
    onSuccess: () => {
      queryClient.invalidateQueries(['allDisputes']);
      toast.success("Dispute status updated successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to update dispute status: ${error.message}`);
    }
  });

  const updateCommissionMutation = useMutation({
    mutationFn: (newPercentage) =>
      axiosFetch.put('/commission', { percentage: newPercentage })
        .then(({ data }) => data)
        .catch((err) => {
          console.error("Error updating commission:", err);
          throw err;
        }),
    onSuccess: () => {
      queryClient.invalidateQueries(['commission']);
      toast.success("Commission percentage updated successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to update commission: ${error.message}`);
    }
  });

  const handleCommissionUpdate = (e) => {
    e.preventDefault();
    updateCommissionMutation.mutate(commissionPercentage);
  };

  const getChartData = () => {
    if (!dashboardData || !dashboardData.commissionByTime) return [];
    switch (chartTimePeriod) {
      case 'yearly':
        return dashboardData.commissionByTime.yearly;
      case 'monthly':
        return dashboardData.commissionByTime.monthly;
      case 'weekly':
        return dashboardData.commissionByTime.weekly;
      case 'daily':
        if (dashboardData.commissionByTime.daily && dashboardData.commissionByTime.daily.length > 0) {
          const latestDayData = dashboardData.commissionByTime.daily[dashboardData.commissionByTime.daily.length - 1];
          return latestDayData.data;
        }
        return [];
      default:
        return dashboardData.commissionByTime.monthly;
    }
  };

  const chartData = getChartData();

  // Mock data for different time periods
  const mockChartDataYearly = [
    { name: '2019', commission: 50000 },
    { name: '2020', commission: 70000 },
    { name: '2021', commission: 90000 },
    { name: '2022', commission: 120000 },
    { name: '2023', commission: 150000 },
  ];
  const mockChartDataMonthly = [
    { name: 'Jan', commission: 8000 },
    { name: 'Feb', commission: 12000 },
    { name: 'Mar', commission: 15000 },
    { name: 'Apr', commission: 18000 },
    { name: 'May', commission: 20000 },
    { name: 'Jun', commission: 22000 },
    { name: 'Jul', commission: 25000 },
    { name: 'Aug', commission: 27000 },
    { name: 'Sep', commission: 30000 },
    { name: 'Oct', commission: 32000 },
    { name: 'Nov', commission: 35000 },
    { name: 'Dec', commission: 37000 }
  ];
  const mockChartDataWeekly = [
    { name: 'Week 1', commission: 5000 },
    { name: 'Week 2', commission: 7000 },
    { name: 'Week 3', commission: 9000 },
    { name: 'Week 4', commission: 12000 },
    { name: 'Week 5', commission: 15000 },
  ];
  const mockChartDataDaily = [
    { name: 'Mon', commission: 1200 },
    { name: 'Tue', commission: 1500 },
    { name: 'Wed', commission: 1800 },
    { name: 'Thu', commission: 2000 },
    { name: 'Fri', commission: 2200 },
    { name: 'Sat', commission: 2500 },
    { name: 'Sun', commission: 2700 },
  ];

  // Select mock data based on chartTimePeriod
  let chartDataToShow = mockChartDataMonthly;
  switch (chartTimePeriod) {
    case 'yearly':
      chartDataToShow = mockChartDataYearly;
      break;
    case 'monthly':
      chartDataToShow = mockChartDataMonthly;
      break;
    case 'weekly':
      chartDataToShow = mockChartDataWeekly;
      break;
    case 'daily':
      chartDataToShow = mockChartDataDaily;
      break;
    default:
      chartDataToShow = mockChartDataMonthly;
  }

  const broadcastMutation = useMutation({
    mutationFn: (data) =>
      axiosFetch.post('/notifications', data)
        .then(({ data }) => data)
        .catch((err) => {
          console.error("Error sending broadcast:", err);
          throw err;
        }),
    onSuccess: () => {
      toast.success("Broadcast message sent successfully!");
      setMessage('');
      setTargetAudience('all');
    },
    onError: (error) => {
      toast.error(`Failed to send broadcast: ${error.message}`);
    }
  });

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }
    setIsSending(true);
    try {
      await broadcastMutation.mutateAsync({ message, targetAudience });
    } catch (error) {
      console.error("Broadcast error:", error);
    } finally {
      setIsSending(false);
    }
  };

  const createCategoryMutation = useMutation({
    mutationFn: (categoryData) => {
      const formData = new FormData();
      formData.append('name', categoryData.name);
      formData.append('description', categoryData.description);
      if (categoryData.image) {
        formData.append('image', categoryData.image);
      }
      return axiosFetch.post('/categories', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
        .then(({ data }) => data)
        .catch((err) => {
          console.error("Error creating category:", err);
          throw err;
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allCategories']);
      toast.success("Category created successfully!");
      setNewCategory({ name: '', description: '', image: null });
      setPreviewImage(null);
    },
    onError: (error) => {
      toast.error(`Failed to create category: ${error.message}`);
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: (categoryData) => {
      const formData = new FormData();
      formData.append('name', categoryData.name);
      formData.append('description', categoryData.description);
      if (categoryData.image instanceof File) {
        formData.append('image', categoryData.image);
      } else if (categoryData.clearImage) {
          formData.append('clearImage', 'true');
      } else {
          formData.append('image_url_unchanged', categoryData.image || '');
      }
      
      return axiosFetch.put(`/categories/${categoryData.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
        .then(({ data }) => data)
        .catch((err) => {
          console.error("Error updating category:", err);
          throw err;
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allCategories']);
      toast.success("Category updated successfully!");
      setEditingCategory(null);
      setCurrentCategoryName('');
      setCurrentCategoryDesc('');
      setCurrentCategoryImage(null);
      setPreviewImage(null);
    },
    onError: (error) => {
      toast.error(`Failed to update category: ${error.message}`);
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (categoryId) =>
      axiosFetch.delete(`/categories/${categoryId}`)
        .then(({ data }) => data)
        .catch((err) => {
          console.error("Error deleting category:", err);
          throw err;
        }),
    onSuccess: () => {
      queryClient.invalidateQueries(['allCategories']);
      toast.success("Category deleted successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to delete category: ${error.message}`);
    }
  });

  const handleCreateCategory = (e) => {
    e.preventDefault();
    createCategoryMutation.mutate(newCategory);
  };

  const handleUpdateCategory = (e) => {
    e.preventDefault();
    updateCategoryMutation.mutate({
      id: editingCategory,
      name: currentCategoryName,
      description: currentCategoryDesc,
      image: currentCategoryImage,
      clearImage: false
    });
  };

  const handleDeleteCategory = (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      deleteCategoryMutation.mutate(categoryId);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    // Remove the /api prefix from VITE_API_URL for static file serving
    const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '');
    return `${baseUrl}${imagePath}`;
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category._id);
    setCurrentCategoryName(category.name);
    setCurrentCategoryDesc(category.description);
    setCurrentCategoryImage(category.image);
    setPreviewImage(category.image ? getImageUrl(category.image) : null);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setCurrentCategoryName('');
    setCurrentCategoryDesc('');
    setCurrentCategoryImage(null);
    setPreviewImage(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (editingCategory) {
          setCurrentCategoryImage(file);
          setPreviewImage(reader.result);
        } else {
          setNewCategory({ ...newCategory, image: file });
        setPreviewImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    if (editingCategory) {
      setCurrentCategoryImage(null);
      setPreviewImage(null);
    } else {
      setNewCategory({ ...newCategory, image: null });
      setPreviewImage(null);
    }
  };

  const handleViewDispute = (dispute) => {
    setSelectedDispute(dispute);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedDispute(null);
  };

  return (
    <div className='admin-dashboard-layout'>
      <AdminSidebar activeItem={activeMenuItem} setActiveItem={setActiveMenuItem} extraMenuItems={[]} />
      <div className="admin-content">
        <center><h1>Admin DashBoard</h1></center>

        {activeMenuItem === 'dashboard' && (
          <div className="dashboard-section">
            <h2>Admin Dashboard Overview</h2>
            {isDashboardLoading ? (
              <Loader size={30} />
            ) : dashboardError ? (
              <p>Error loading dashboard data: {dashboardError.message}</p>
            ) : (
              <>
                <div className="dashboard-stats">
                  <div className="stat-card">
                    <h3>Number of Users</h3>
                    <p>{dashboardData.totalUsers}</p>
                  </div>
                  <div className="stat-card">
                    <h3>Number of Gigs</h3>
                    <p>{dashboardData.totalGigs}</p>
                  </div>
                  <div className="stat-card">
                    <h3>Total Commission</h3>
                    <p>{dashboardData.totalCommission.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
                  </div>
                </div>
                <div className="admin-commission-rect-graph">
                  <h3>Admin Commission Profit</h3>
                  <div className="chart-controls">
                    <button
                      className={chartTimePeriod === 'yearly' ? 'active' : ''}
                      onClick={() => setChartTimePeriod('yearly')}
                    >
                      Yearly
                    </button>
                    <button
                      className={chartTimePeriod === 'monthly' ? 'active' : ''}
                      onClick={() => setChartTimePeriod('monthly')}
                    >
                      Monthly
                    </button>
                    <button
                      className={chartTimePeriod === 'weekly' ? 'active' : ''}
                      onClick={() => setChartTimePeriod('weekly')}
                    >
                      Weekly
                    </button>
                    <button
                      className={chartTimePeriod === 'daily' ? 'active' : ''}
                      onClick={() => setChartTimePeriod('daily')}
                    >
                      Daily
                    </button>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartDataToShow} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" axisLine={{ stroke: '#8884d8', strokeWidth: 2 }} tick={{ fill: '#fff', fontSize: 14 }} />
                      <YAxis type="number" axisLine={{ stroke: '#8884d8', strokeWidth: 2 }} tick={{ fill: '#fff', fontSize: 14 }} />
                      <Tooltip contentStyle={{ background: '#23284a', border: 'none', color: '#fff' }} />
                      <Legend wrapperStyle={{ color: '#fff' }} />
                      <Line
                        type="monotone"
                        dataKey="commission"
                        stroke="#6c63ff"
                        strokeWidth={3}
                        dot={{ r: 6, fill: "#181c2f", stroke: "#6c63ff", strokeWidth: 2 }}
                        activeDot={{ r: 8 }}
                        name="Commission"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        )}

        {activeMenuItem === 'reviews' && (
          <div className="review-management-section">
            <h2>Review Management</h2>
            {isReviewsLoading ? (
              <Loader size={30} />
            ) : reviewsError ? (
              <p>Error loading reviews: {reviewsError.message}</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>GIG TITLE</th>
                    <th>USER</th>
                    <th>STAR</th>
                    <th>DESCRIPTION</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewsData.map(review => (
                    <tr key={review._id}>
                      <td>{review._id}</td>
                      <td>{review.gigID?.title || 'N/A'}</td>
                      <td>{review.userID?.username || 'N/A'}</td>
                      <td>{review.star}</td>
                      <td>{review.description}</td>
                      <td>
                        <button onClick={() => handleDeleteReview(review._id)} className="delete-btn">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeMenuItem === 'commission' && (
          <div className="commission-management-section">
            <h2>Commission Management</h2>
            {isCommissionLoading ? (
              <Loader size={30} />
            ) : commissionError ? (
              <p>Error loading commission data: {commissionError.message}</p>
            ) : (
              <form onSubmit={handleCommissionUpdate}>
                <div className="form-group">
                  <label>Commission Percentage:</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={commissionPercentage}
                    onChange={(e) => setCommissionPercentage(Number(e.target.value))}
                  />
                </div>
                <button type="submit" disabled={updateCommissionMutation.isLoading}>
                  {updateCommissionMutation.isLoading ? 'Updating...' : 'Update Commission'}
                </button>
              </form>
            )}
          </div>
        )}

        {activeMenuItem === 'disputes' && (
          <div className="disputes-section">
            <h2>Dispute Management</h2>
            {isDisputesLoading ? (
              <Loader size={30} />
            ) : disputesError ? (
              <p>Error loading disputes: {disputesError.message}</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>USER NAME</th>
                    <th>USER TYPE</th>
                    <th>SUBJECT</th>
                    <th>DESCRIPTION</th>
                    <th>ORDER/GIG ID</th>
                    <th>STATUS</th>
                    <th>SUBMITTED ON</th>
                    <th>VIEW</th>
                  </tr>
                </thead>
                <tbody>
                  {disputesData.map(dispute => (
                    <tr key={dispute._id}>
                      <td>{dispute._id}</td>
                      <td>{dispute.userID?.username || 'N/A'}</td>
                      <td>{dispute.userID?.isSeller ? 'Seller' : 'Customer'}</td>
                      <td>{dispute.subject}</td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dispute.description}</td>
                      <td>{dispute.orderGigId || 'N/A'}</td>
                      <td>{dispute.status}</td>
                      <td>{new Date(dispute.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          onClick={() => handleViewDispute(dispute)}
                          style={{
                            padding: '4px 12px',
                            borderRadius: 4,
                            background: '#6c63ff',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeMenuItem === 'broadcast' && (
          <div className="broadcast-section">
            <h2>Send Broadcast Message</h2>
            <form onSubmit={handleBroadcast}>
              <div className="form-group">
                <label htmlFor="message">Message:</label>
                <textarea
                  id="message"
                  rows="5"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  disabled={isSending}
                ></textarea>
              </div>
              <div className="form-group">
                <label htmlFor="targetAudience">Send to:</label>
                <select
                  id="targetAudience"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  disabled={isSending}
                >
                  <option value="all">All (Customers & Sellers)</option>
                  <option value="customers">Only Customers</option>
                  <option value="sellers">Only Sellers</option>
                </select>
              </div>
              <button type="submit" disabled={isSending}>
                {isSending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        )}

        {activeMenuItem === 'users' && (
          <div className="all-users-section">
            <h2>All Users</h2>
            {isUsersLoading ? (
              <Loader size={30} />
            ) : usersError ? (
              <p>Error loading users: {usersError.message}</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Is Seller</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {usersData.map(user => (
                    <tr key={user._id}>
                      <td>{user._id}</td>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{user.isSeller ? 'Yes' : 'No'}</td>
                      <td>{user.isActive ? 'Active' : 'Inactive'}</td>
                      <td>
                        <button 
                          onClick={() => handleUserStatusToggle(user._id, user.isActive)}
                          disabled={updateUserStatusMutation.isLoading}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeMenuItem === 'gigApproval' && (
          <GigApproval />
        )}

        {activeMenuItem === 'categories' && (
          <div className="category-management-section">
            <h2>Category Management</h2>
            <div className="category-forms">
              <h3>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
              <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="category-form">
                <div className="form-group">
                  <label htmlFor="categoryName">Category Name:</label>
                  <input
                    type="text"
                    id="categoryName"
                    value={editingCategory ? currentCategoryName : newCategory.name}
                    onChange={(e) => editingCategory ? setCurrentCategoryName(e.target.value) : setNewCategory({ ...newCategory, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="categoryDescription">Description:</label>
                  <textarea
                    id="categoryDescription"
                    rows="3"
                    value={editingCategory ? currentCategoryDesc : newCategory.description}
                    onChange={(e) => editingCategory ? setCurrentCategoryDesc(e.target.value) : setNewCategory({ ...newCategory, description: e.target.value })}
                  ></textarea>
                </div>
                <div className="form-group file-upload-group">
                  <label htmlFor="categoryImage">Category Image:</label>
                  <input
                    type="file"
                    id="categoryImage"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {(previewImage || (editingCategory && currentCategoryImage)) && (
                    <div className="image-preview">
                      <img src={previewImage || getImageUrl(currentCategoryImage)} alt="Category Preview" />
                      <button type="button" onClick={handleClearImage} className="clear-image-button">X</button>
                    </div>
                  )}
                </div>
                <div className="button-group">
                  <button type="submit" disabled={createCategoryMutation.isLoading || updateCategoryMutation.isLoading}>
                    {editingCategory ? (updateCategoryMutation.isLoading ? 'Updating...' : 'Update Category') : (createCategoryMutation.isLoading ? 'Adding...' : 'Add Category')}
                  </button>
                  {editingCategory && (
                    <button type="button" onClick={handleCancelEdit} className="cancel-edit-button">Cancel Edit</button>
                  )}
                </div>
              </form>
            </div>

            <h3>Existing Categories</h3>
            {isCategoriesLoading ? (
              <Loader size={30} />
            ) : categoriesError ? (
              <p>Error loading categories: {categoriesError.message}</p>
            ) : (
              <div className="category-cards">
                {categoriesData.map((category) => (
                  <div key={category._id} className="category-card">
                    <div className="category-image">
                      {category.image ? (
                        <img src={getImageUrl(category.image)} alt={category.name} />
                      ) : (
                        <div className="no-image">No Image</div>
                      )}
                    </div>
                    <div className="category-info">
                      <h4>{category.name}</h4>
                      <p>{category.description}</p>
                    </div>
                    <div className="category-actions">
                      <button onClick={() => handleEditCategory(category)} className="edit-button">
                        <i className="fas fa-edit"></i> Edit
                      </button>
                      <button onClick={() => handleDeleteCategory(category._id)} className="delete-button">
                        <i className="fas fa-trash"></i> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal for viewing dispute details */}
        {modalOpen && selectedDispute && (
          <div
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: 12,
                padding: 32,
                minWidth: 350,
                maxWidth: 500,
                boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                position: 'relative'
              }}
            >
              <h2 style={{ marginBottom: 16 }}>Dispute Details</h2>
              <div style={{ marginBottom: 8 }}>
                <strong>User Name:</strong> {selectedDispute.userID?.username || 'N/A'}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>User Type:</strong> {selectedDispute.userID?.isSeller ? 'Seller' : 'Customer'}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Subject:</strong> {selectedDispute.subject}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Description:</strong>
                <div style={{
                  background: '#f6f6f6',
                  padding: 12,
                  borderRadius: 6,
                  marginTop: 4,
                  maxHeight: 200,
                  overflowY: 'auto'
                }}>
                  {selectedDispute.description}
                </div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Status:</strong> {selectedDispute.status}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Submitted On:</strong> {new Date(selectedDispute.createdAt).toLocaleDateString()}
              </div>
              <button
                onClick={handleCloseModal}
                style={{
                  marginTop: 16,
                  padding: '6px 18px',
                  borderRadius: 6,
                  background: '#6c63ff',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 