const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const amqp = require('amqplib');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const port = 3016; // Port for listing service

// Load Swagger documentation
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Middleware
app.use(express.json());
app.use(cors()); // Enable CORS

// RabbitMQ consumer
const consumeMessages = async () => {
  try {
    const conn = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await conn.createChannel();
    await channel.assertQueue('availability_created');
    await channel.assertQueue('availability_deleted');
    await channel.assertQueue('availability_updated');

    const logMessage = (queue, msg) => {
      const messageContent = msg.content.toString();
      console.log(`Received a message in ${queue} queue:`, messageContent);

      // Save the message to a plain text file
      const logEntry = `${new Date().toISOString()} [${queue}]: ${messageContent}\n`;
      fs.appendFile('availability_log.txt', logEntry, (err) => { // El archivo se guarda en el directorio de ejecución
        if (err) {
          console.error('Failed to write message to file:', err);
        } else {
          console.log('Message logged to availability_log.txt');
        }
      });
    };

    channel.consume('availability_created', (msg) => {
      logMessage('availability_created', msg);
    });

    channel.consume('availability_deleted', (msg) => {
      logMessage('availability_deleted', msg);
    });

    channel.consume('availability_updated', (msg) => {
      logMessage('availability_updated', msg);
    });

  } catch (err) {
    console.error('Failed to connect to RabbitMQ:', err);
  }
};

consumeMessages();

app.listen(port, () => {
  console.log(`Service running on http://localhost:${port}`);
});
