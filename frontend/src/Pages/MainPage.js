import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import Cookies from 'js-cookie';
import io from 'socket.io-client';
import axios from 'axios';
import './MainPage.css'; // Import Styles
import Edificios from './Edificios.jpg';

const MainPage = () => {
  const [messages, setMessages] = useState([]);
  const [reservations, setReservations] = useState([]);
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
  };

  useEffect(() => {
    const token = Cookies.get('token');

    const socket = io('https://microservice-websocket-30e27c571914.herokuapp.com', {
      query: { token }
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
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

  useEffect(() => {
    axios.get('https://microservice-list-reservation-9e286342001c.herokuapp.com/reservations')
      .then(response => setReservations(response.data))
      .catch(error => console.error('Error fetching reservations:', error));
  }, []);

  return (
    <div className="main-page-container">
      <header className="main-page-header">
        <Header onLogout={handleLogout} />
      </header>
      <main className="main-page-content">
        <div className="welcome-section">
        <img src={Edificios} alt="Welcome" className="welcome-image" />
          <h2>Welcome to SportCom!</h2>
        </div>
        <h2>Current Reservation</h2>
        <hr class="custom-line"></hr>
        <section className="reservations-container">
          {reservations.length > 0 ? (
            reservations.map(reservation => (
              <div className="reservation-card" key={reservation.id}>
                <h3>{reservation.facility_name}</h3>
                <p><strong>User:</strong> {reservation.user_name}</p>
                <p><strong>Date:</strong> {reservation.reservation_date}</p>
                <p><strong>Status:</strong> {reservation.status}</p>
              </div>
            ))
          ) : (
            <p>No reservations found.</p>
          )}
        </section>
        <ul>
          {messages.map((message, index) => (
            <li key={index}>{message}</li>
          ))}
        </ul>
      </main>
      <footer className="main-page-footer">
        <p>Footer content-Add continue test 2</p>
      </footer>
    </div>
  );
};

export default MainPage;
