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
      const response = await axios.post('http://localhost:3001/login', {
        email,
        password
      }, { withCredentials: true }); // Asegúrate de incluir withCredentials aquí

      setMessage('Login successful!');
      Cookies.set('token', response.data.token, { expires: 1, secure: false, sameSite: 'Lax' });
      navigate('/main'); // Main view
    } catch (error) {
      console.error('Error during login:', error);
      setMessage('Contraseña o usuario incorrecto. Ingrese de nuevo');
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
