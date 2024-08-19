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

// Endpoint to update a facility
app.put('/facilities/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, descripcion, tutor } = req.body;

  try {
    const connection = await connectToDatabase();

    // Execute stored procedure
    const [result] = await connection.execute('CALL UpdateFacility(?, ?, ?, ?)', [id, name, descripcion, tutor]);
    console.log('Facility updated:', result);

    // Send message to RabbitMQ
    const conn = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await conn.createChannel();
    await channel.assertQueue('facility_updated');
    channel.sendToQueue('facility_updated', Buffer.from(JSON.stringify({ id, name, descripcion, tutor })));
    console.log('Message sent to RabbitMQ');

    res.status(200).send(result);
    await connection.end(); // Close MySQL connection
  } catch (err) {
    res.status(500).send(err.message);
  }
});

const port = process.env.PORT || 3005;

app.listen(port, () => {
  console.log(`Service running on http://localhost:${port}`);
});