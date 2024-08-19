const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const amqp = require('amqplib/callback_api');
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

// RabbitMQ configuration
const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
const logoutQueue = 'user-login';


// RabbitMQ consumer to listen for logout messages
const consumeMessages = () => {
  amqp.connect(rabbitUrl, (error0, connection) => {
    if (error0) {
      console.error('RabbitMQ connection error:', error0);
      return;
    }
    console.log('Connected to RabbitMQ');
    
    connection.createChannel((error1, channel) => {
      if (error1) {
        console.error('RabbitMQ channel error:', error1);
        return;
      }
      console.log('Channel created');
      
      channel.assertQueue(logoutQueue, { durable: true }, (error2) => {
        if (error2) {
          console.error('Error asserting queue:', error2);
          return;
        }
        console.log('Queue asserted');
        
        channel.consume(logoutQueue, (msg) => {
          if (msg !== null) {
            const message = JSON.parse(msg.content.toString());
            console.log(" [x] Received %s", message);
            channel.ack(msg);
          }
        });
      });
    });
  });
};

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
