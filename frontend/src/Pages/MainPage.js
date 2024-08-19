import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import Cookies from 'js-cookie';
import io from 'socket.io-client';
import './MainPage.css'; // Asegúrate de importar el CSS

const MainPage = () => {
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Aquí puedes hacer una llamada al backend para cerrar sesión si es necesario
    // Luego, redirige al usuario a la página de inicio de sesión
    navigate('/');
  };

  useEffect(() => {
    const token = Cookies.get('token');

    const socket = io('http://localhost:3003', {
      query: { token }
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      // Send a welcome message or any other message to the server upon connection
      socket.emit('message', 'User connected');
    });

    socket.on('message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="main-page-container">
      <header className="main-page-header">
        <Header onLogout={handleLogout} />
      </header>
      <main className="main-page-content">
        <h2>Welcome to SportCom!</h2>
        <ul>
          {messages.map((message, index) => (
            <li key={index}>{message}</li>
          ))}
        </ul>
      </main>
      <footer className="main-page-footer">
        <p>Footer content</p>
      </footer>
    </div>
  );
};

export default MainPage;
