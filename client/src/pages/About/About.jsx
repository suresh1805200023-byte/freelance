import React from 'react';
import "./About.scss";

const About = () => {
  return (
    <div className="about">
      <div className="container">
        <section className="hero-section">
          <h1>Connecting Talent with Opportunity</h1>
          <p className="subtitle">
            Welcome to <strong>Freelance Marketplace</strong>, the premier destination where world-class talent meets ambitious businesses.
          </p>
        </section>

        <hr />

        <div className="content-grid">
          <section className="story">
            <h2>Our Story</h2>
            <p>
              Founded with the vision of decentralizing the global workforce, we began as a small project to help creatives find meaningful work. Today, we have evolved into a robust ecosystem supporting developers, designers, and writers from every corner of the globe.
            </p>
            <p>
              We believe that great work shouldn't be limited by borders. Our platform provides the tools, security, and community needed for remote collaboration to thrive.
            </p>
          </section>

          <section className="mission">
            <h2>Our Mission</h2>
            <p>
              To empower individuals to build their own professional future while helping businesses scale through the power of elite freelance expertise.
            </p>
          </section>
        </div>

        <section className="values">
          <h2>Why Choose Us?</h2>
          <div className="values-grid">
            <div className="value-card">
              <h3>Reliability</h3>
              <p>Secure payment systems and verified profiles ensure peace of mind for every project.</p>
            </div>
            <div className="value-card">
              <h3>Quality</h3>
              <p>Our curated categories make it easy to find specialists who are masters of their craft.</p>
            </div>
            <div className="value-card">
              <h3>Community</h3>
              <p>We aren't just a platform; we are a global network of innovators and problem solvers.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;