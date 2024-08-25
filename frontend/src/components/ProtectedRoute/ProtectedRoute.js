import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ element }) => {
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  };

  const token = getCookie('token');
  console.log('Token:', token); // Verify token in Aplication Web
  return token ? element : <Navigate to="/" />;
};

export default ProtectedRoute;
