import { Link } from "react-router-dom";
import './Footer.scss';

const Footer = () => {
  return (
    <div className='footer'>
      <div className="container">
        <div className="top">
          <div className="item">
            <h1>Company</h1>
            <Link className="footer-link" to="/">Home</Link>
            <Link className="footer-link" to="/about">About Us</Link>
            <Link className="footer-link" to="/contact">Contact Us</Link>
          </div>
          <div className="item">
            <h1>Support</h1>
            <Link className="footer-link" to="/help">Help Center</Link>
            <Link className="footer-link" to="/gigs">Browse Gigs</Link>
            <Link className="footer-link" to="/wishlist">Wishlist</Link>
          </div>
          <div className="item">
            <h1>For Users</h1>
            <Link className="footer-link" to="/register">Join as Freelancer</Link>
            <Link className="footer-link" to="/login">Sign In</Link>
            <span>Trusted freelance marketplace</span>
          </div>
        </div>
        <hr />
        <div className="bottom">
          <div className="left">
            <h2>Freelance Website</h2>
            <span>{new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="right">
            <Link className="footer-link" to="/about">Privacy</Link>
            <Link className="footer-link" to="/contact">Terms</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Footer