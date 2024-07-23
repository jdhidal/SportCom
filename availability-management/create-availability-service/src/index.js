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
const port = 3012; // Port for create-availability-service

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

  // Endpoint to create new availability
  app.post('/availability', async (req, res) => {
    try {
      const { start_date, end_date, spots, cost } = req.body;

      // Execute stored procedure
      const result = await pool.request()
        .input('start_date', mssql.Date, start_date)
        .input('end_date', mssql.Date, end_date)
        .input('spots', mssql.Int, spots)
        .input('cost', mssql.Decimal(10, 2), cost)
        .execute('sp_CreateAvailability'); // Name of the stored procedure

      // Send message to RabbitMQ
      const conn = await amqp.connect(process.env.RABBITMQ_URL);
      const channel = await conn.createChannel();
      await channel.assertQueue('availability_created');
      channel.sendToQueue('availability_created', Buffer.from(JSON.stringify({ start_date, end_date, spots, cost })));
      console.log('Message sent to RabbitMQ');

      res.status(201).json({ id: result.recordset[0].id }); // Assuming the stored procedure returns the ID
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

}).catch(err => console.error('Database connection failed:', err));

app.listen(port, () => {
    console.log(`Create Availability Service running on http://localhost:${port}`);
});
