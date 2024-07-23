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
const port = 3008; // Port for create reservation service

const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(express.json());
app.use(cors()); // Enable CORS

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

  // Endpoint to create a new reservation
  app.post('/reservations', async (req, res) => {
    try {
      const { facility_name, user_name, reservation_date, status } = req.body;

      // Execute stored procedure
      const result = await pool.request()
        .input('facility_name', mssql.NVarChar, facility_name)
        .input('user_name', mssql.NVarChar, user_name)
        .input('reservation_date', mssql.DateTime, reservation_date)
        .input('status', mssql.NVarChar, status)
        .execute('CreateReservation'); // Name of the stored procedure

      // Send message to RabbitMQ
      const conn = await amqp.connect(process.env.RABBITMQ_URL);
      const channel = await conn.createChannel();
      await channel.assertQueue('reservation_created');
      channel.sendToQueue('reservation_created', Buffer.from(JSON.stringify({ facility_name, user_name, reservation_date, status })));
      console.log('Message sent to RabbitMQ');

      res.status(201).json({ id: result.recordset[0].id }); // Assuming the stored procedure returns the ID
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

}).catch(err => console.error('Database connection failed:', err));

app.listen(port, () => {
    console.log(`Service running on http://localhost:${port}`);
});
