// src/components/UserLogs/UserLogs.js

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserLogs.css';

const UserLogs = () => {
  const [logs, setLogs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch user logs on component mount
    fetch('http://localhost:3019/api/user-logs')
      .then(response => response.json())
      .then(data => setLogs(data))
      .catch(error => console.error('Error fetching user logs:', error));
  }, []);

  const handleBackClick = () => {
    navigate('/main');
  };

  return (
    <div className="user-logs">
      <button className="back-button" onClick={handleBackClick}>Back</button>
      <h1>User Logs</h1>
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

export default UserLogs;
