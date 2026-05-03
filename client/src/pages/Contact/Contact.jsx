import React from 'react';
import "./Contact.scss";
import { Mail, Phone, MapPin, Globe, Headphones } from "lucide-react"; // Using Lucide icons for a clean look

const Contact = () => {
  return (
    <div className="contact">
      <div className="container">
        <section className="header">
          <h1>Get in Touch</h1>
          <p>Have questions? We're here to help you navigate our freelance marketplace.</p>
        </section>

        <div className="contact-grid">
          {/* Support Section */}
          <div className="contact-card">
            <Headphones className="icon" size={40} />
            <h3>Customer Support</h3>
            <p>Our team is available 24/7 to assist with project disputes or account issues.</p>
            <span className="link">support@freelancemarket.com</span>
          </div>

          {/* Sales Section */}
          <div className="contact-card">
            <Mail className="icon" size={40} />
            <h3>Business Inquiries</h3>
            <p>Interested in enterprise solutions or partnership opportunities?</p>
            <span className="link">partners@freelancemarket.com</span>
          </div>

          {/* Office Section */}
          <div className="contact-card">
            <MapPin className="icon" size={40} />
            <h3>Our Headquarters</h3>
            <p>123 Digital Nomad Way,<br />Tech District, SF 94103</p>
          </div>
        </div>

        <section className="socials">
          <h2>Follow Our Community</h2>
          <div className="social-links">
            <span>LinkedIn</span>
            <span>Twitter</span>
            <span>Instagram</span>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Contact;