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
const port = 3006; // Change port for update service

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

  // Endpoint to update a facility
  app.put('/facilities/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, descripcion, tutor } = req.body;

      // Execute stored procedure
      const result = await pool.request()
        .input('id', mssql.Int, id)
        .input('name', mssql.NVarChar, name)
        .input('descripcion', mssql.NVarChar, descripcion)
        .input('tutor', mssql.NVarChar, tutor)
        .execute('UpdateFacility'); // Name of the stored procedure

      // Send message to RabbitMQ
      const conn = await amqp.connect(process.env.RABBITMQ_URL);
      const channel = await conn.createChannel();
      await channel.assertQueue('facility_updated');
      channel.sendToQueue('facility_updated', Buffer.from(JSON.stringify({ id, name, descripcion, tutor })));
      console.log('Message sent to RabbitMQ');

      res.status(200).send(result);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

}).catch(err => console.error('Database connection failed:', err));

app.listen(port, () => {
    console.log(`Service running on http://localhost:${port}`);
});
