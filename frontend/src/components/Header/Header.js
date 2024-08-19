// src/components/Header/Header.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

const Header = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    fetch('http://localhost:3002/logout', {
      method: 'POST',
      credentials: 'include' //Make sure to include cookies in your request
    })
    .then(response => response.json())
    .then(data => {
      console.log(data.message);
      onLogout(); // Call the onLogout function passed as prop
      navigate('/'); // Redirects to login after logout
    })
    .catch(error => console.error('Error:', error));
  };

  const goToFacilitiesForm = () => {
    navigate('/facilities');
  };

  const goToReservationForm = () => {
    navigate('/reservations');
  }

  return (
    <header className="header">
      <button onClick={goToReservationForm}>Reservations</button>
      <button onClick={goToFacilitiesForm}>Facilities</button>
      <button onClick={handleLogout}>Logout</button>
    </header>
  );
};

export default Header;
