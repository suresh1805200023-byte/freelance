import { Navigate, useLocation } from 'react-router-dom';

// Accept an adminOnly prop which defaults to false
const PrivateRoute = ({ children, adminOnly = false }) => {
  const user = JSON.parse(localStorage.getItem('user')) || null;
  const { pathname } = useLocation();

  // Check for login status
  if (!user) {
    // Redirect to login if not logged in
    return <Navigate to='/login' state={{ from: pathname }} replace />;
  }

  // If adminOnly is true, also check if the user is an admin
  if (adminOnly && !user.isAdmin) {
    // Redirect to homepage or a forbidden page if admin access is required but user is not admin
    // Redirecting to login might be confusing, maybe redirect to home or a 403 page is better.
    // For now, let's redirect to home.
    return <Navigate to='/' state={{ from: pathname }} replace />;
  }

  // If logged in (and admin if adminOnly is true), render the children
  return children;
}

export default PrivateRoute