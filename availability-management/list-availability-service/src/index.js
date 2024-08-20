const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const mysql = require('mysql2/promise');
const amqp = require('amqplib');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();

const app = express();

// Load Swagger documentation
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Middleware
app.use(express.json());
app.use(cors()); // Enable CORS

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
};

// Connect to the database
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

// Endpoint to list all availability
app.get('/availability', async (req, res) => {
  let connection;
  try {
    connection = await connectToDatabase();
    const [rows] = await connection.execute('SELECT * FROM availability');
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).send(err.message);
  } finally {
    if (connection) {
      await connection.end(); // Close MySQL connection
    }
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
      // Process the message here
    });

    channel.consume('availability_deleted', (msg) => {
      console.log('Received a message in availability_deleted queue:', msg.content.toString());
      // Process the message here
    });

    channel.consume('availability_updated', (msg) => {
      console.log('Received a message in availability_updated queue:', msg.content.toString());
      // Process the message here
    });

  } catch (err) {
    console.error('Failed to connect to RabbitMQ:', err);
  }
};

// Start RabbitMQ consumer
consumeMessages();

const port = process.env.PORT || 3015;
// Start the server
app.listen(port, () => {
  console.log(`Service running on http://localhost:${port}`);
});
