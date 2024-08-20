const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const amqp = require('amqplib');
require('dotenv').config();

const app = express();


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
      const conn = await amqp.connect(process.env.RABBITMQ_URL);
      const channel = await conn.createChannel();
      await channel.assertQueue('user-created');
      channel.sendToQueue('user-created', Buffer.from(JSON.stringify({ name, email, hashedPassword })));
      console.log('Message sent to RabbitMQ');
    
      // Close RabbitMQ connection
      await channel.close();
      await conn.close();

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

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Service running on http://localhost:${port}`);
});
