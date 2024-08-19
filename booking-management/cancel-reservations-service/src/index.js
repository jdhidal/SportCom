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

// Endpoint to cancel a reservation
app.put('/reservations/:id', async (req, res) => {
  const reservationId = parseInt(req.params.id, 10);

  if (isNaN(reservationId)) {
    return res.status(400).send('Invalid reservation ID');
  }

  let connection;
  try {
    connection = await connectToDatabase();

    // Start a transaction
    await connection.beginTransaction();

    // Execute stored procedure
    const [result] = await connection.execute(
      'CALL CancelReservation(?)', 
      [reservationId]
    );

    // Commit the transaction
    await connection.commit();
    console.log('Reservation canceled:', result);

    // Send message to RabbitMQ
    const conn = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await conn.createChannel();
    await channel.assertQueue('reservation_canceled');
    channel.sendToQueue('reservation_canceled', Buffer.from(JSON.stringify({ reservationId })));
    console.log('Message sent to RabbitMQ');

    res.status(200).send(result);
  } catch (err) {
    if (connection) {
      await connection.rollback(); // Rollback transaction on error
    }
    res.status(500).send(err.message);
  } finally {
    if (connection) {
      await connection.end(); // Close MySQL connection
    }
  }
});

const port = process.env.PORT || 3009;

app.listen(port, () => {
  console.log(`Service running on http://localhost:${port}`);
});
