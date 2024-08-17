import React from 'react';
import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const ProtectedRoute = ({ element: Component }) => {
  const token = Cookies.get('token');
  console.log('Token:', token); // Verifica el token en la consola

  return token ? Component : <Navigate to="/" />;
};

export default ProtectedRoute;
