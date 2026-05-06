import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { axiosFetch, generateImageURL } from '../../../utils';
import './Register.scss'

const countries = [
  "United States", "Canada", "United Kingdom", "Australia", "Germany", "France", "India", "Brazil", "Japan", "China",
  "Mexico", "Italy", "Spain", "South Korea", "Russia", "Argentina", "South Africa", "Egypt", "Nigeria", "Indonesia",
  "Pakistan", "Bangladesh", "Philippines", "Vietnam", "Turkey", "Iran", "Thailand", "Myanmar", "Colombia", "Kenya",
  "Ukraine", "Poland", "Algeria", "Morocco", "Peru", "Venezuela", "Malaysia", "Uzbekistan", "Saudi Arabia", "Yemen"
];

const languages = [
  "English", "Spanish", "French", "German", "Chinese (Mandarin)", "Hindi", "Arabic", "Portuguese", "Bengali", "Russian",
  "Japanese", "Punjabi", "Javanese", "Telugu", "Marathi", "Vietnamese", "Tamil", "Urdu", "Korean", "Italian",
  "Turkish", "Persian (Farsi)", "Thai", "Gujarati", "Kannada", "Malayalam", "Odia", "Burmese", "Polish", "Ukrainian",
  "Romanian", "Dutch", "Greek", "Czech", "Swedish", "Finnish", "Danish", "Norwegian", "Hebrew", "Swahili"
];

const Register = () => {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formInput, setFormInput] = useState({
    username: "",
    email: "",
    password: "",
    phone: '',
    description: '',
    isSeller: false,
    country: '',
  });

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault();

    for (let key in formInput) {
      if (formInput[key] === '') {
        toast.error('Please fill all input field: ' + key);
        return;
      }
      else if (key === 'phone' && formInput[key].length < 9) {
        toast.error('Enter valid phone number!');
        return;
      }
    }

    setLoading(true);
    try {
      const { url } = await generateImageURL(image);
      const { data } = await axiosFetch.post('/auth/register', { ...formInput, image: url });
      if (data?.token) {
        localStorage.setItem('accessToken', data.token);
      }
      toast.success('Registration successful!');
      setLoading(false);
      navigate('/login');
    }
    catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
      setLoading(false);
    }
  }

  const handleChange = (event) => {
    const { value, name, type, checked, options } = event.target;

    let inputValue;
    if (type === 'checkbox') {
      inputValue = checked;
    } else if (name === 'languagesKnown' && options) {
      inputValue = Array.from(options)
        .filter(option => option.selected)
        .map(option => option.value);
    } else {
      inputValue = value;
    }

    setFormInput({
      ...formInput,
      [name]: inputValue
    });
  }

  return (
    <div className="register">
      <form onSubmit={handleSubmit}>
        <div className="left">
          <h1>Create a new account</h1>
          <label htmlFor="">Username</label>
          <input
            name="username"
            type="text"
            placeholder="johndoe"
            onChange={handleChange}
          />
          <label htmlFor="">Email</label>
          <input
            name="email"
            type="email"
            placeholder="email"
            onChange={handleChange}
          />
          <label htmlFor="">Password</label>
          <input name="password" type="password" onChange={handleChange} />
          <label htmlFor="">Profile Picture</label>
          <input type="file" onChange={(event) => setImage(event.target.files[0])} />
          <button type="submit" disabled={loading}>{loading ? 'Loading...' : 'Register'}</button>
        </div>
        <div className="right">
          <p>Already have an account? <Link to='/login'>Signin</Link></p>
          <h1>I want to become a seller</h1>
          <div className="toggle">
            <label htmlFor="">Activate the seller account</label>
            <label className="switch">
              <input type="checkbox" name='isSeller' onChange={handleChange} />
              <span className="slider round"></span>
            </label>
          </div>
          <label htmlFor="">Phone Number</label>
          <input
            name="phone"
            type="text"
            placeholder="+1 1234 567 890"
            onChange={handleChange}
          />
          <label htmlFor="">Description</label>
          <textarea
            placeholder="A short description of yourself"
            name="description"
            id=""
            cols="30"
            rows="10"
            onChange={handleChange}
          ></textarea>
          <label htmlFor="">Country</label>
          <select name="country" onChange={handleChange} value={formInput.country}>
            <option value="">Select Country</option>
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </form>
    </div>
  )
}

export default Register