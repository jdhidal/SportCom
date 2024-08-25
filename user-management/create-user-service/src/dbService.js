// dbService.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
};

const createUserInDB = async (name, email, hashedPassword) => {
  const connection = await mysql.createConnection(dbConfig);
  const [result] = await connection.execute(
    'CALL sp_createUser(?, ?, ?)', 
    [name, email, hashedPassword]
  );
  await connection.end();
  return result;
};

module.exports = { createUserInDB };
