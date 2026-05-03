const AdminSidebar = ({ activeItem, setActiveItem }) => {
  return (
    <div className="admin-sidebar">
      <ul>
        <li className={activeItem === 'dashboard' ? 'active' : ''} onClick={() => setActiveItem('dashboard')}>
          <i className="fas fa-chart-line"></i> Dashboard
        </li>
        <li className={activeItem === 'users' ? 'active' : ''} onClick={() => setActiveItem('users')}>
          <i className="fas fa-users"></i> Users
        </li>
        <li className={activeItem === 'gigs' ? 'active' : ''} onClick={() => setActiveItem('gigs')}>
          <i className="fas fa-briefcase"></i> Gigs
        </li>
        <li className={activeItem === 'orders' ? 'active' : ''} onClick={() => setActiveItem('orders')}>
          <i className="fas fa-shopping-cart"></i> Orders
        </li>
        <li className={activeItem === 'reviews' ? 'active' : ''} onClick={() => setActiveItem('reviews')}>
          <i className="fas fa-star"></i> Reviews
        </li>
        <li className={activeItem === 'categories' ? 'active' : ''} onClick={() => setActiveItem('categories')}>
          <i className="fas fa-tags"></i> Categories
        </li>
        <li className={activeItem === 'commission' ? 'active' : ''} onClick={() => setActiveItem('commission')}>
          <i className="fas fa-percentage"></i> Commission
        </li>
        <li className={activeItem === 'gigApproval' ? 'active' : ''} onClick={() => setActiveItem('gigApproval')}>
          <i className="fas fa-check-circle"></i> Gig Approval
        </li>
      </ul>
    </div>
  );
};

export default AdminSidebar; 