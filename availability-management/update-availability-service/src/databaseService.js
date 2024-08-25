// databaseService.js
const mysql = require('mysql2/promise');
const { dbConfig } = require('./config');

const connectToDatabase = async () => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL');
    return connection;
  } catch (err) {
    console.error('Database connection failed:', err);
    throw err;
  }
};

module.exports = { connectToDatabase };
