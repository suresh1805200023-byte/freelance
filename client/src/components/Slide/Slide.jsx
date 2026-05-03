import ReactSlick from 'react-slick';
import { Children } from 'react';
import PrevArrow from '../Arrows/PrevArrow';
import NextArrow from '../Arrows/NextArrow';

import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

import './Slide.scss';

const Slide = (props) => {
  const { children, slidesToShow, slidesToScroll, responsive } = props;
  const SlickSlider = ReactSlick?.default || ReactSlick;

  // Count children safely for arrays, fragments, and conditionals
  const numberOfItems = Children.count(children);
  const visibleSlides = slidesToShow || 4;
  const hasMoreSlides = numberOfItems > visibleSlides;

  const settings = {
    infinite: hasMoreSlides,
    slidesToShow: visibleSlides,
    slidesToScroll: slidesToScroll || 1,
    centerMode: true, // Enable center mode
    centerPadding: '0px', // Adjust as needed to prevent extra padding
    arrows: hasMoreSlides,
    dots: hasMoreSlides,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    swipeToSlide: true,
    responsive: responsive || [] // Use responsive prop or an empty array if not provided
  };

  return (
    <div className='slide-Container'>
      <SlickSlider {...settings}>
        {children}
      </SlickSlider>
    </div>
  )
}

export default Slide;