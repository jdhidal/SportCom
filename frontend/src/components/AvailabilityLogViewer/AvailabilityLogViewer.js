import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AvailabilityLogViewer.css'; 

const AvailabilityLogViewer = () => {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        // Fetch logs on component mount
        axios.get('http://localhost:3016/api/availability-logs')
            .then(response => setLogs(response.data))
            .catch(error => console.error('Error fetching logs:', error));
    }, []);

    return (
        <div className="log-viewer">
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
