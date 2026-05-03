import Slider from "react-slick";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { GrFormNext, GrFormPrevious } from "react-icons/gr";
import { axiosFetch } from "../../utils";
import { useRecoilState } from "recoil";
import { userState } from "../../atoms";
import { Loader } from "..";
import { useQuery } from '@tanstack/react-query';
import "./Navbar.scss";


import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Navbar = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useRecoilState(userState);
  const [isLoading, setIsLoading] = useState(false);

  const { data: notifications, refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications', user?._id],
    queryFn: () => axiosFetch.get('/notifications').then(({ data }) => data.notifications),
    enabled: !!user,
    refetchInterval: 60000,
  });

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axiosFetch.patch(`/notifications/${notificationId}/read`);
      refetchNotifications();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        console.log("Fetching user data from /auth/me...");
        const { data } = await axiosFetch.get('/auth/me');
        if (data.user) {
          setUser(data.user);
          console.log("User state after setting:", data.user);
        } else {
          console.log("No user data received");
          setUser(null);
        }
      } catch (error) {
        console.log("Auth error:", error?.response?.data?.message || "Authentication failed");
        setUser(null);
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const isActive = () => {
    window.scrollY > 0 ? setShowMenu(true) : setShowMenu(false);
  };

  useEffect(() => {
    window.addEventListener("scroll", isActive);
    return () => {
      window.removeEventListener("scroll", isActive);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await axiosFetch.post("/auth/logout");
      localStorage.removeItem('user');
      setUser(null);
      navigate("/");
    } catch ({ response }) {
      console.log(response.data);
    }
  };

  return (
    <nav className={showMenu || pathname !== "/" ? "navbar active" : "navbar"}>
      <div className="container">
        <div className="logo">
          <Link to="/" className="link">
            <div className="logo-content">
              <div className="main-logo">
                <img src="/media/logo.png" alt="Logo" className="logo-icon"/>
                <span className="text">Freelance Website</span>
              </div>
            </div>
          </Link>
        </div>

        <div className="links">
          {/* Static Navigation Links */}
          <span>
            <Link to="/about" className="link">About Us</Link>
          </span>
          <span>
            <Link to="/contact" className="link">Contact Us</Link>
          </span>

          <div className="menu-links">
            {!user?.isSeller && <span></span>}
          </div>

          {isLoading ? (
            <Loader size={35} />
          ) : (
            <>
              {!user && (
                <>
                  <span>
                    <Link to="/login" className="link">Sign in</Link>
                  </span>
                  <button className={showMenu || pathname !== "/" ? "join-active" : ""}>
                    <Link to="/register" className="link">Join</Link>
                  </button>
                </>
              )}

              {user && (
                <div className="user-section">
                  <div className="notification-icon" onClick={() => setShowNotifications(!showNotifications)}>
                    <img src="/media/bell.png" alt="Notifications" />
                    {notifications?.length > 0 && (
                      <span className="notification-count">{notifications.length}</span>
                    )}
                    {showNotifications && (
                      <div className="notifications-dropdown">
                        {notifications && notifications.length > 0 ? (
                          notifications.map((notification) => (
                            <div key={notification._id} className="notification-item" onClick={() => handleMarkAsRead(notification._id)}>
                              <p>{notification.message}</p>
                              <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                            </div>
                          ))
                        ) : (
                          <p>No new notifications.</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="user" onClick={() => setShowPanel(!showPanel)}>
                    <img src={user.image || "/media/noavatar.png"} alt="User" />
                    <span>{user?.username}</span>
                    {showPanel && (
                      <div className="options">
                        {user?.isAdmin ? (
                          <Link className="link" to="/admin/dashboard">Admin Dashboard</Link>
                        ) : (
                          <>
                            {user?.isSeller && (
                              <>
                                <Link className="link" to="/my-gigs">Gigs</Link>
                                <Link className="link" to="/organize">Add New Gig</Link>
                                <Link className="link" to="/community">Community</Link>
                              </>
                            )}
                            <Link className="link" to="/orders">Orders</Link>
                            <Link className="link" to="/wishlist">My Wishlist</Link>
                            <Link className="link" to="/help">Help</Link>
                          </>
                        )}
                        <Link className="link" to="/" onClick={handleLogout}>Logout</Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;