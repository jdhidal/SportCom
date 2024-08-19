// src/components/Header/Header.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

const Header = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    fetch('http://localhost:3002/logout', {
      method: 'POST',
      credentials: 'include'
    })
      .then(response => response.json())
      .then(data => {
        console.log(data.message);
        onLogout();
        navigate('/');
      })
      .catch(error => console.error('Error:', error));
  };

  const goToFacilitiesForm = () => {
    navigate('/facilities');
  };

  const goToReservationForm = () => {
    navigate('/reservations');
  };

  return (
    <header className="header">
      <button className="button" onClick={goToReservationForm}>Reservations</button>
      <button className="button" onClick={goToFacilitiesForm}>Facilities</button>
      <button className="button logout-button" onClick={handleLogout}>Logout</button>
    </header>
  );
};

export default Header;
