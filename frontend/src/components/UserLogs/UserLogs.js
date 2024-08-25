import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraphQLClient, gql } from 'graphql-request';
import './UserLogs.css';

const client = new GraphQLClient('https://microservice-user-logs-fef7fff92cba.herokuapp.com/graphql');

const GET_LOGS = gql`
  query {
    getLogs {
      timestamp
      queueName
      messageContent
    }
  }
`;

const UserLogs = () => {
  const [logs, setLogs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch user logs on component mount
    client.request(GET_LOGS)
      .then(data => setLogs(data.getLogs))
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
