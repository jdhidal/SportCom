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

const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(express.json());
app.use(cors()); // Enable CORS

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

// Endpoint to list all reservations
app.get('/reservations', async (req, res) => {
  try {
    const connection = await connectToDatabase();
    const [rows] = await connection.execute('SELECT * FROM reservations');
    res.status(200).json(rows);
    await connection.end(); // Close MySQL connection
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// RabbitMQ consumer
const consumeMessages = async () => {
  try {
    const conn = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await conn.createChannel();
    await channel.assertQueue('reservation_created');
    await channel.assertQueue('reservation_deleted');
    await channel.assertQueue('reservation_canceled');

    channel.consume('reservation_created', (msg) => {
      console.log('Received a message in reservation_created queue:', msg.content.toString());
    });

    channel.consume('reservation_canceled', (msg) => {
      console.log('Received a message in reservation_canceled queue:', msg.content.toString());
    });

    channel.consume('reservation_deleted', (msg) => {
      console.log('Received a message in reservation_deleted queue:', msg.content.toString());
    });

  } catch (err) {
    console.error('Failed to connect to RabbitMQ:', err);
  }
};

consumeMessages();

const port = process.env.PORT || 3011;

app.listen(port, () => {
  console.log(`Service running on http://localhost:${port}`);
});
