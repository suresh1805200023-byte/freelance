import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { axiosFetch } from '../../utils';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Attempting admin login...");
    try {
      const res = await axiosFetch.post('/auth/login', { username, password });
      console.log("Admin login response data:", res.data);
      // Assuming the backend returns user data with isAdmin flag
      if (res.data.user && res.data.user.isAdmin) {
        // Redirect to admin dashboard or desired admin page
        toast.success('Admin login successful!');
        navigate('/admin/dashboard'); // Replace with your admin dashboard route
      } else {
        toast.error('Invalid credentials or not an admin user.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className='admin-login'>
      <form onSubmit={handleSubmit}>
        <h1>Admin Login</h1>
        <label htmlFor='username'>Username:</label>
        <input
          type='text'
          id='username'
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <label htmlFor='password'>Password:</label>
        <input
          type='password'
          id='password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type='submit'>Login</button>
      </form>
    </div>
  );
};

export default AdminLogin; 