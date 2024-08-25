import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import './LoginForm.css';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('https://microservice-login-b1831f0a3737.herokuapp.com/login', {
        email,
        password
      }, { withCredentials: true }); // Credential

      setMessage('Login successful!');
      Cookies.set('token', response.data.token, { expires: 1, secure: false, sameSite: 'Lax' });
      navigate('/main'); // Main view
    } catch (error) {
      console.error('Error during login:', error);
      setMessage('Password or users incorrect. Please log in again');
    }
  };

  return (
    <div className="form-wrapper">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-control">
          <input
            type="email"
            required
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label>Enter your email</label>
        </div>
        <div className="form-control">
          <input
            type="password"
            required
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label>Enter your password</label>
        </div>
        <button type="submit">Login</button>
        <button onClick={() => navigate('/create')}>Create Account</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default LoginForm;
