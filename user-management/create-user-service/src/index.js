const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const amqp = require('amqplib/callback_api');
require('dotenv').config();

const app = express();
const port = 3000;

// Middleware CORS
app.use(cors());

// Middleware to handle JSON bodies
app.use(express.json());

// Load Swagger YAML
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

// Configure Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Configure MySQL connection
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
};

// Configure RabbitMQ
const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost';

// Endpoint to create users
app.post('/create', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Encrypt Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Connect to the database
    const connection = await mysql.createConnection(dbConfig);

    const [result] = await connection.execute(
      'CALL sp_createUser(?, ?, ?)',
      [name, email, hashedPassword]
    );

    // Connect to RabbitMQ and send the message
    amqp.connect(rabbitUrl, (error0, connection) => {
      if (error0) {
        console.error('RabbitMQ connection error:', error0);
        if (!res.headersSent) {
          return res.status(500).json({ error: 'Error connecting to RabbitMQ' });
        }
      }

      connection.createChannel((error1, channel) => {
        if (error1) {
          console.error('RabbitMQ channel error:', error1);
          if (!res.headersSent) {
            return res.status(500).json({ error: 'Error creating RabbitMQ channel' });
          }
        }

        const queue = 'user-created';
        const message = JSON.stringify({ email, name });

        // Ensure the queue exists
        channel.assertQueue(queue, { durable: true }, (error2) => {
          if (error2) {
            console.error('Error asserting queue:', error2);
            if (!res.headersSent) {
              return res.status(500).json({ error: 'Error asserting RabbitMQ queue' });
            }
          }

          channel.sendToQueue(queue, Buffer.from(message));
          console.log(" [x] Sent %s", message);
          
          // Close the connection only after the message is sent
          setTimeout(() => {
            channel.close(() => {
              connection.close();
            });
          }, 500);
        });
      });
    });

    if (!res.headersSent) {
      res.status(201).json({ message: 'User created successfully', rowsAffected: result.affectedRows });
    }
  } catch (err) {
    console.error('Error creating user:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error creating user' });
    }
  }
});

app.listen(port, () => {
  console.log(`Service running on http://localhost:${port}`);
});
