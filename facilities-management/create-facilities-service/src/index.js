const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const mssql = require('mssql');
const amqp = require('amqplib');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');  // Import the 'path' module

dotenv.config();

const app = express();
const port = 3005;

const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(express.json());
app.use(cors());  // Enable CORS

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

  // Endpoint to create a new facility
  app.post('/facilities', async (req, res) => {
    try {
      const { name, descripcion, tutor } = req.body;

      // Execute stored procedure
      const result = await pool.request()
        .input('name', mssql.NVarChar, name)
        .input('descripcion', mssql.NVarChar, descripcion)
        .input('tutor', mssql.NVarChar, tutor)
        .execute('CreateFacility');  // Name of the stored procedure

      // Send message to RabbitMQ
      const conn = await amqp.connect(process.env.RABBITMQ_URL);
      const channel = await conn.createChannel();
      await channel.assertQueue('facility_created');
      channel.sendToQueue('facility_created', Buffer.from(JSON.stringify({ name, descripcion, tutor })));
      console.log('Message sent to RabbitMQ');

      // Close RabbitMQ connection
      await channel.close();
      await conn.close();

      res.status(201).send(result);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

}).catch(err => console.error('Database connection failed:', err));

app.listen(port, () => {
  console.log(`Service running on http://localhost:${port}`);
});
