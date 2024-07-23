// src/components/Header/Header.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

const Header = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    fetch('http://localhost:3002/logout', {
      method: 'POST',
      credentials: 'include' // Asegúrate de incluir las cookies en la solicitud
    })
    .then(response => response.json())
    .then(data => {
      console.log(data.message);
      onLogout(); // Llama a la función onLogout pasada como prop
      navigate('/'); // Redirige al inicio de sesión después del logout
    })
    .catch(error => console.error('Error:', error));
  };
  
  return (
    <header className="header">
      <button onClick={handleLogout}>Logout</button>
    </header>
  );
};

export default Header;
