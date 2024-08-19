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
app.use(cors());  // Enable CORS

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

// Endpoint to delete a reservation
app.delete('/reservations/:id', async (req, res) => {
  const reservationId = parseInt(req.params.id, 10);

  try {
    const connection = await connectToDatabase();

    // Execute stored procedure
    const [result] = await connection.execute('CALL DeleteReservation(?)', [reservationId]);
    console.log('Reservation deleted:', result);

    // Send message to RabbitMQ
    const conn = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await conn.createChannel();
    await channel.assertQueue('reservation_deleted');
    channel.sendToQueue('reservation_deleted', Buffer.from(JSON.stringify({ reservationId })));
    console.log('Message sent to RabbitMQ');

    // Close RabbitMQ connection
    await channel.close();
    await conn.close();

    res.status(200).send(result);
    await connection.end(); // Close MySQL connection
  } catch (err) {
    res.status(500).send(err.message);
  }
});

const port = process.env.PORT || 3010;

app.listen(port, () => {
  console.log(`Service running on http://localhost:${port}`);
});
