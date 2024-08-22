// src/schema.js

const { buildSchema } = require('graphql');
const fs = require('fs');
const path = require('path');

// Ruta para el archivo de log en el mismo nivel que 'src'
const logFilePath = path.join(__dirname, 'users_log.txt');

// Definir el esquema GraphQL
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

// Resolver las funciones para el esquema
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
