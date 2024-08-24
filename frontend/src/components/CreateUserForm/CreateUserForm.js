// src/components/CreateUserForm/CreateUserForm.js

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Importa useNavigate
import './CreateUserForm.css';

const CreateUserForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate(); // Usa useNavigate para redireccionar

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:3000/create', {
        name,
        email,
        password
      });
      setMessage(response.data.message);
      navigate('/'); // Redirige al formulario de login
    } catch (error) {
      console.error('Error creating user:', error);
      setMessage('Error creating user');
    }
  };

  return (
    <div className="form-wrapper">
      <h2>Register</h2>
      <form id="formRegister" onSubmit={handleSubmit}>
        <div className="form-control">
          <input
            type="text"
            required
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <label>Enter your name</label>
        </div>

        <div className="form-control">
          <input
            type="email"
            required
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label>Enter your Email</label>
        </div>

        <div className="form-control">
          <input
            type="password"
            required
            id="pass"
            name="pass"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label>Enter your new Password</label>
        </div>
        <button type="submit">Register</button>
        <button onClick={() => navigate('/')}>Cancel</button> {/* Redirige al formulario de login */}
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default CreateUserForm;
