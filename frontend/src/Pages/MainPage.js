// src/pages/MainPage.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import './MainPage.css'; // Asegúrate de importar el CSS

const MainPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Aquí puedes hacer una llamada al backend para cerrar sesión si es necesario
    // Luego, redirige al usuario a la página de inicio de sesión
    navigate('/');
  };

  return (
    <div className="main-page-container">
      <header className="main-page-header">
        <Header onLogout={handleLogout} />
      </header>
      <main className="main-page-content">
        <h2>Welcome to SportCom!</h2>
      </main>
      <footer className="main-page-footer">
        <p>Footer content</p>
      </footer>
    </div>
  );
};

export default MainPage;
