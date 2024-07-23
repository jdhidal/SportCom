const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const mssql = require('mssql');
const amqp = require('amqplib');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();

const app = express();
const port = 3015; // Port for listing service

// Load Swagger documentation
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Middleware
app.use(express.json());
app.use(cors()); // Enable CORS

// Database configuration
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
      encrypt: true, // For Azure SQL or other encrypted databases
      trustServerCertificate: true // Trust the server's certificate
    }
};

// Connect to the database
mssql.connect(dbConfig).then(pool => {
  if (pool.connected) {
    console.log('Connected to MSSQL');
  }

  // Endpoint to list all reservations
  app.get('/availability', async (req, res) => {
    try {
      const result = await pool.request().query('SELECT * FROM availability');
      res.status(200).json(result.recordset);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  // RabbitMQ consumer
  const consumeMessages = async () => {
    try {
      const conn = await amqp.connect(process.env.RABBITMQ_URL);
      const channel = await conn.createChannel();
      await channel.assertQueue('availability_created');
      await channel.assertQueue('availability_deleted');
      await channel.assertQueue('availability_updated');

      channel.consume('availability_created', (msg) => {
        console.log('Received a message in availability_created queue:', msg.content.toString());
        // Process the reservation_created message
      });

      channel.consume('availability_deleted', (msg) => {
        console.log('Received a message in availability_deleted queue:', msg.content.toString());
        // Process the reservation_canceled message
      });

      channel.consume('availability_updated', (msg) => {
        console.log('Received a message in availability_updated queue:', msg.content.toString());
        // Process the reservation_deleted message
      });

    } catch (err) {
      console.error('Failed to connect to RabbitMQ:', err);
    }
  };

  consumeMessages();

}).catch(err => console.error('Database connection failed:', err));

// Start the server
app.listen(port, () => {
    console.log(`Service running on http://localhost:${port}`);
});
