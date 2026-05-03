import { useEffect, useMemo, useRef } from 'react';
import { Featured, Slide, TrustedBy, CategoryCard, GigCard } from '../../components';
import { useQuery } from '@tanstack/react-query';
import { axiosFetch, removeDuplicateGigs } from '../../utils';

import './Home.scss';

const Home = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    // 🔥 Force video to restart & play on page load
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // autoplay might fail without user interaction (handled by muted)
      });
    }
  }, []);

  // --- Fetching Gigs ---
  const { isLoading: isGigsLoading, error: gigsError, data: gigsData } = useQuery({
    queryKey: ['homepage-gigs'],
    queryFn: () => axiosFetch.get('/gigs').then(({ data }) => data),
  });

  // --- Fetching Categories ---
  const { isLoading: isCatsLoading, error: catsError, data: catsData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => axiosFetch.get('/categories').then(({ data }) => data.categories),
  });

  // Remove duplicate gigs
  const processedGigs = useMemo(() => removeDuplicateGigs(gigsData || []), [gigsData]);

  return (
    <div className='home'>
      <Featured />
      <TrustedBy />

      {/* 1. Category Slider */}
      <section className="section-wrapper">
        <div className="container">
          <h2>Popular Categories</h2>
          <Slide slidesToShow={Math.min(5, catsData?.length || 1)}>
            {isCatsLoading ? (
              Array(5).fill(0).map((_, i) => <div key={i} className="skeleton card-skeleton" />)
            ) : catsError ? (
              <div className="error-msg">Failed to load categories.</div>
            ) : (
              catsData.map((card) => <CategoryCard key={card._id} data={card} />)
            )}
          </Slide>
        </div>
      </section>

      {/* 2. Features Section */}
      <section className="features">
        <div className="container">
          <div className="item">
            <h1>A whole world of freelance talent at your fingertips</h1>

            <div className="feature-item">
              <div className="headline">
                <img src="/media/check.png" alt="check" />
                <h6>The best for every budget</h6>
              </div>
              <p>Find high-quality services at every price point.</p>
            </div>

            <div className="feature-item">
              <div className="headline">
                <img src="/media/check.png" alt="check" />
                <h6>Quality work done quickly</h6>
              </div>
              <p>Start your project within minutes.</p>
            </div>

            <div className="feature-item">
              <div className="headline">
                <img src="/media/check.png" alt="check" />
                <h6>Protected payments</h6>
              </div>
              <p>You pay only after approving the work.</p>
            </div>

            <div className="feature-item">
              <div className="headline">
                <img src="/media/check.png" alt="check" />
                <h6>24/7 support</h6>
              </div>
              <p>We’re here anytime you need help.</p>
            </div>
          </div>

          {/* 🎥 VIDEO FIXED HERE */}
          <div className="item">
            <div className="video-container">
              <video
                ref={videoRef}
                src="/media/video.mp4"
                poster="https://fiverr-res.cloudinary.com/q_auto,f_auto,w_700,dpr_1.0/v1/attachments/generic_asset/asset/089e3bb9352f90802ad07ad9f6a4a450-1599517407052/selling-proposition-still-1400-x1.png"
                autoPlay
                muted
                loop
                playsInline
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Business Section */}
      <section className="features dark">
        <div className="container">
          <div className="item">
            <span className="badge">NEW</span>
            <h2>Business Solutions</h2>
            <h1>A solution designed for <span>teams</span></h1>

            <ul className="business-list">
              <li><img src="/media/check.png" alt="" /> Proven freelancers</li>
              <li><img src="/media/check.png" alt="" /> Dedicated manager</li>
              <li><img src="/media/check.png" alt="" /> Team productivity tools</li>
            </ul>

            <button>Explore Business</button>
          </div>

          <div className="item">
            <img src="/media/business.jpg" alt="Business" />
          </div>
        </div>
      </section>

      {/* 4. Gigs Slider */}
      <section className="section-wrapper grey-bg">
        <div className="container">
          <Slide
            slidesToShow={Math.min(4, processedGigs.length || 1)}
            responsive={[
              { breakpoint: 1200, settings: { slidesToShow: 3 } },
              { breakpoint: 768, settings: { slidesToShow: 2 } },
              { breakpoint: 480, settings: { slidesToShow: 1 } }
            ]}
          >
            {isGigsLoading ? (
              Array(4).fill(0).map((_, i) => <div key={i} className="skeleton gig-skeleton" />)
            ) : gigsError ? (
              <div className="error-msg">Error loading gigs!</div>
            ) : (
              processedGigs.map((gig) => <GigCard key={gig._id} data={gig} />)
            )}
          </Slide>
        </div>
      </section>
    </div>
  );
};

export default Home;