import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Featured.scss';

const Featured = () => {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  
  const handleSearch = () => {
    if(search.trim()) {
      navigate(`/gigs?search=${encodeURIComponent(search.trim())}`);
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }

  return (
    <div className='featured'>
      <div className="container">

        <div className="left">
          <h1>Find the perfect services for your business</h1>
          <div className="search">
            <div className="searchInput">
              <img src="./media/search.png" alt="search" />
              <input 
                type="search" 
                placeholder='Try "website"' 
                value={search}
                onChange={(({ target: { value } }) => setSearch(value))}
                onKeyPress={handleKeyPress}
              />
            </div>
            <button onClick={handleSearch}>Search</button>
          </div>
         
        </div>

        <div className="right">
          <img src="./media/abstract.jpg" alt="ab" />
        </div>
        
      </div>
    </div>
  )
}

export default Featured