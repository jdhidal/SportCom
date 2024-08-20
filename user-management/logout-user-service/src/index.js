const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const amqp = require('amqplib');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser'); // Importa cookie-parser
const cors = require('cors'); // Importa cors

dotenv.config();

const app = express();

// Load Swagger YAML
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

// Configure Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Middleware to parse cookies
app.use(cookieParser()); // Usa cookie-parser para leer cookies

// Middleware for CORS
app.use(cors({
    origin: 'http://localhost:3021', // Cambia esto según el origen de tu frontend
    credentials: true
  }));

// Middleware to parse JSON bodies
app.use(express.json()); // Para analizar cuerpos JSON

// RabbitMQ consumer to listen for logout messages
const consumeMessages = async () => {
  try {
    const conn = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await conn.createChannel();
    await channel.assertQueue('user-login');

    channel.consume('user-login', (msg) => {
      console.log('Received a message in user_created queue:', msg.content.toString());
    });

  } catch (err) {
    console.error('Failed to connect to RabbitMQ:', err);
  }
};

consumeMessages();

// Logout route
app.post('/logout', (req, res) => {
    // Borra la cookie 'token' sin necesidad de leer mensajes de RabbitMQ
    res.clearCookie('token', { httpOnly: true, sameSite: 'None', secure: true });
    res.json({ message: 'Logout successful' });
});
  
const port = process.env.PORT || 3002;

app.listen(port, () => {
  console.log(`Logout service running on http://localhost:${port}`);
  consumeMessages(); // Start listening to RabbitMQ messages
});
