// src/pages/MainPage.js

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import './MainPage.css'; // Asegúrate de importar el CSS
import io from 'socket.io-client';

const MainPage = () => {
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Connect to WebSocket server
    const token = document.cookie.split('; ').find(row => row.startsWith('token=')).split('=')[1];
    const newSocket = io('http://localhost:3004', {
      query: { token }
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    newSocket.on('message', (data) => {
      console.log('Message from server:', data);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

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
