// src/components/ReservationLogs/ReservationLogs.js

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ReservationLogs.css';

const ReservationLogs = () => {
  const [logs, setLogs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch reservation logs on component mount
    fetch('http://localhost:3018/api/reservation-logs')
      .then(response => response.json())
      .then(data => setLogs(data))
      .catch(error => console.error('Error fetching reservation logs:', error));
  }, []);

  const handleBackClick = () => {
    navigate('/main');
  };

  return (
    <div className="reservation-logs">
      <button className="back-button" onClick={handleBackClick}>Back</button>
      <h1>Reservation Logs</h1>
      <ul>
        {logs.map((log, index) => (
          <li key={index}>
            <strong>{log.timestamp}</strong> - [{log.queueName}] : {log.messageContent}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ReservationLogs;
