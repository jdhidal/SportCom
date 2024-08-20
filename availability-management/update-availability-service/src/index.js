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

// Endpoint to update availability
app.put('/availability/:id', async (req, res) => {
  const { id } = req.params;
  const { start_date, end_date, spots, cost } = req.body;

  if (!start_date || !end_date || !spots || !cost) {
    return res.status(400).send('All fields are required');
  }

  let connection;
  try {
    connection = await connectToDatabase();

    // Execute stored procedure
    const [result] = await connection.execute(
      'CALL sp_UpdateAvailability(?, ?, ?, ?, ?)', 
      [id, start_date, end_date, spots, cost]
    );
    console.log('Availability updated:', result);

    // Send message to RabbitMQ
    const conn = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await conn.createChannel();
    await channel.assertQueue('availability_updated');
    channel.sendToQueue('availability_updated', Buffer.from(JSON.stringify({ id, start_date, end_date, spots, cost })));
    console.log('Message sent to RabbitMQ');

    res.status(200).send('Availability updated');
  } catch (err) {
    res.status(500).send(err.message);
  } finally {
    if (connection) {
      await connection.end(); // Close MySQL connection
    }
  }
});

const port = process.env.PORT || 3013;

app.listen(port, () => {
  console.log(`Update Availability Service running on http://localhost:${port}`);
});
