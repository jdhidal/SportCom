import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AvailabilityLogViewer.css'; 

const AvailabilityLogViewer = () => {
    const [logs, setLogs] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch logs on component mount
        axios.get('https://microservice-avail-logs-326615635c36.herokuapp.com/api/availability-logs')
            .then(response => setLogs(response.data))
            .catch(error => console.error('Error fetching logs:', error));
    }, []);
    
    const handleBackClick = () => {
        navigate('/main');
    };

    return (
        <div className="log-viewer">
            <button className="back-button" onClick={handleBackClick}>Back</button>
            <h2>Availability Logs</h2>
            <ul>
                {logs.length > 0 ? (
                    logs.map((log, index) => (
                        <li key={index}>
                            <span>{log.timestamp}</span> - <strong>{log.queueName}</strong>: {log.messageContent}
                        </li>
                    ))
                ) : (
                    <li>No logs available</li>
                )}
            </ul>
        </div>
    );
};

export default AvailabilityLogViewer;
