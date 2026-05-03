import React from 'react';
import './AdminSidebar.scss';
import { Link } from 'react-router-dom';

const AdminSidebar = ({ activeItem, setActiveItem, extraMenuItems = [] }) => {
  const menuItems = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'broadcast', label: 'Broadcast Messages' },
    { key: 'users', label: 'All Users' },
    { key: 'reviews', label: 'Review Management' },
    { key: 'disputes', label: 'Disputes' },
    { key: 'commission', label: 'Commission Management' },
    { key: 'gigApproval', label: 'Gig Approval' },
    { key: 'categories', label: 'Category Management' },
    ...extraMenuItems,
  ];

  return (
    <div className="admin-sidebar">
      <div className="sidebar-header">
        <h3>Admin Panel</h3>
        <p>Management Tools</p>
      </div>
      <div className="sidebar-menu">
        {menuItems.map(item => (
          <Link
            key={item.key}
            to="#"
            className={`menu-item ${activeItem === item.key ? 'active' : ''}`}
            onClick={() => setActiveItem(item.key)}
          >
            <span className="menu-dot" />
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminSidebar;
