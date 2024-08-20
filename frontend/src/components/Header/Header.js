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

  const goToAvailabilityForm = () => {
    navigate('/availability');
  };

  const goToAvailabilityLog = () => {
    navigate('/availability-logs'); 
  };

  const goToFacilityLogs = () => {
    navigate('/facility-logs');
  };

  const goToReservationLogs = () => {
    navigate('/reservation-logs');
  };

  const goToUserLogs = () => {
    navigate('/user-logs');
  };

  return (
    <header className="header">
      <button className="button" onClick={goToReservationForm}>Reservations</button>
      <button className="button" onClick={goToFacilitiesForm}>Facilities</button>
      <button className="button" onClick={goToAvailabilityForm}>Availability</button>
      <button className="button" onClick={goToAvailabilityLog}>Availability Logs</button>
      <button className="button" onClick={goToFacilityLogs}>Facility Logs</button>
      <button className="button" onClick={goToReservationLogs}>Reservation Logs</button>
      <button className="button" onClick={goToUserLogs}>User Logs</button>
      <button className="button logout-button" onClick={handleLogout}>Logout</button>
    </header>
  );
};

export default Header;
