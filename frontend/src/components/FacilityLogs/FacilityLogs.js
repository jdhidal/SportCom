// src/components/FacilityLogs/FacilityLogs.js

import React, { useEffect, useState } from 'react';
import './FacilityLogs.css';

const FacilityLogs = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Fetch facility logs on component mount
    fetch('http://localhost:3017/api/facility-logs')
      .then(response => response.json())
      .then(data => setLogs(data))
      .catch(error => console.error('Error fetching facility logs:', error));
  }, []);

  return (
    <div className="facility-logs">
      <button className="back-button" onClick={handleBackClick}>Back</button>
      <h1>Facility Logs</h1>
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

export default FacilityLogs;
