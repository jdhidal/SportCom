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
const port = 3013; // Port for delete-availability-service

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

  // Endpoint to delete availability
  app.delete('/availability/:id', async (req, res) => {
    try {
      const id = req.params.id;

      // Execute stored procedure
      await pool.request()
        .input('id', mssql.Int, id)
        .execute('sp_DeleteAvailability'); // Name of the stored procedure

      // Connect to RabbitMQ
      const conn = await amqp.connect(process.env.RABBITMQ_URL);
      const channel = await conn.createChannel();
      await channel.assertQueue('availability_deleted');
      channel.sendToQueue('availability_deleted', Buffer.from(JSON.stringify({ id })));
      console.log('Message sent to RabbitMQ');

      res.status(200).send('Availability deleted');
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

}).catch(err => console.error('Database connection failed:', err));

app.listen(port, () => {
    console.log(`Delete Availability Service running on http://localhost:${port}`);
});
