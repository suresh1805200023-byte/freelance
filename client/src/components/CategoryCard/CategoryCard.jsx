import { Link } from 'react-router-dom';
import './CategoryCard.scss';

const Card = (props) => {
  const { data } = props;

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const baseUrl = apiUrl.replace(/\/api\/?$/, '');
    return `${baseUrl}${imagePath}`;
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