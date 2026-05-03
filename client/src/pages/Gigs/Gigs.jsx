import { useState, useRef, useEffect } from 'react';
import { GigCard, Loader } from '../../components';
import { useQuery } from "@tanstack/react-query";
import { useLocation } from 'react-router-dom';
import { axiosFetch } from '../../utils';
import './Gigs.scss';

const Gigs = () => {
  const [openMenu, setOpenMenu] = useState(false);
  const [sortBy, setSortBy] = useState('sales');
  const minRef = useRef();
  const maxRef = useRef();
  const { search: queryString } = useLocation();

  const queryParams = new URLSearchParams(queryString);
  const categoryFromUrl = queryParams.get('category') || 'All Gigs';
  const searchFromUrl = queryParams.get('search') || '';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { isLoading, error, data, refetch } = useQuery({
    queryKey: ['gigs', sortBy, queryString],
    queryFn: () => {
      const params = new URLSearchParams(queryString);
      if (minRef.current?.value) params.append('min', minRef.current.value);
      if (maxRef.current?.value) params.append('max', maxRef.current.value);
      params.append('sort', sortBy);

      return axiosFetch.get(`/gigs?${params.toString()}`).then(({ data }) => data);
    }
  });
  
  // Refetch when filters change
  useEffect(() => {
    refetch();
  }, [sortBy, queryString, refetch]);

  const handleSortBy = (type) => {
    setSortBy(type);
    setOpenMenu(false);
  };

  const handlePriceFilter = () => {
    refetch();
  };

  return (
    <div className='gigs'>
      <div className="container">
        <span className="breadcrumbs">
          FREELANCE {">"} {categoryFromUrl.toUpperCase()}
        </span>
        <h1>{categoryFromUrl}</h1>
        <p className="subtitle">
          {searchFromUrl 
            ? `Results for "${searchFromUrl}"` 
            : `Explore the boundaries of art and technology with our ${categoryFromUrl} experts.`}
        </p>

        <div className="filter-bar">
          <div className="left">
            <span className="label">Budget</span>
            <div className="inputs">
              <input ref={minRef} type="number" placeholder='Min' />
              <input ref={maxRef} type="number" placeholder='Max' />
              <button onClick={handlePriceFilter}>Apply</button>
            </div>
          </div>
          <div className="right">
            <span className='sortBy'>Sort by</span>
            <div className="sort-container">
              <span className='sortType' onClick={() => setOpenMenu(!openMenu)}>
                {sortBy === 'sales' ? 'Best Selling' : sortBy === 'createdAt' ? 'Newest' : 'Top Rated'}
                <img src="./media/down.png" alt="" className={openMenu ? "active" : ""} />
              </span>
              {openMenu && (
                <div className="rightMenu">
                  <span onClick={() => handleSortBy('sales')}>Best Selling</span>
                  <span onClick={() => handleSortBy('createdAt')}>Newest</span>
                  <span onClick={() => handleSortBy('starNumber')}>Top Rated</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="cards">
          {isLoading ? (
            <div className='loader'><Loader size={45} /></div>
          ) : error ? (
            <div className="error-message">Something went wrong! Please try again later.</div>
          ) : data?.length === 0 ? (
            <div className="no-results">No gigs found matching your criteria.</div>
          ) : (
            data?.map((gig) => <GigCard key={gig._id} data={gig} />)
          )}
        </div>
      </div>
    </div>
  );
};

export default Gigs;