import { Link } from 'react-router-dom';
import './CategoryCard.scss';

const Card = (props) => {
  const { data } = props;

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    const rawPath = String(imagePath).replace(/\\/g, '/');

    // Already an absolute URL (possibly old HTTP URL)
    if (/^https?:\/\//i.test(rawPath)) {
      return rawPath.replace(/^http:\/\//i, 'https://');
    }

    const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
    const baseUrl = apiUrl.replace(/\/api\/?$/, '');
    const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;

    return `${baseUrl}${normalizedPath}`;
  };

  return (
    <Link className='categoryCardLink' to={`/gigs?category=${data.name}`}>
      <div className='cardContainer'>
        <img src={getImageUrl(data.image)} alt={data.name} />
        <div className='content'>
          <span className='desc'>{data.description}</span>
          <span className='title'>{data.name}</span>
        </div>
      </div>
    </Link>
  )
}

export default Card