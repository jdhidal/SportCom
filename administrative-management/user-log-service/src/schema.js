// src/schema.js

const { buildSchema } = require('graphql');
const fs = require('fs');
const path = require('path');


const logFilePath = path.join(__dirname, 'users_log.txt');

// Esquema GraphQL
const schema = buildSchema(`
  type Log {
    timestamp: String
    queueName: String
    messageContent: String
  }

  type Query {
    getLogs: [Log]
  }
`);

// Esquema
const root = {
  getLogs: () => {
    const logs = fs.readFileSync(logFilePath, 'utf8').trim().split('\n').map(log => {
      const [timestamp, queueName, messageContent] = log.match(/\[(.*?)\]\s*:\s*(.*)/).slice(1);
      return { timestamp, queueName, messageContent };
    });
    return logs;
  }
};

module.exports = { schema, root };
