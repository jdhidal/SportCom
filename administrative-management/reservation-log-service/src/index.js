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
const port = 3018; // Updated port for the service

const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(express.json());
app.use(cors()); // Enable CORS

// RabbitMQ consumer
const consumeMessages = async () => {
  try {
    const conn = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await conn.createChannel();
    await channel.assertQueue('reservation_created');
    await channel.assertQueue('reservation_deleted');
    await channel.assertQueue('reservation_canceled');

    const logMessage = (queue, messageContent) => {
      const logEntry = `${new Date().toISOString()} [${queue}]: ${messageContent}\n`;
      fs.appendFile('reservation_log.txt', logEntry, (err) => { // Log file path
        if (err) {
          console.error('Failed to write message to file:', err);
        } else {
          console.log('Message logged to reservation_log.txt');
        }
      });
    };

    channel.consume('reservation_created', (msg) => {
      console.log('Received a message in reservation_created queue:', msg.content.toString());
      logMessage('reservation_created', msg.content.toString());
    });

    channel.consume('reservation_deleted', (msg) => {
      console.log('Received a message in reservation_deleted queue:', msg.content.toString());
      logMessage('reservation_deleted', msg.content.toString());
    });

    channel.consume('reservation_canceled', (msg) => {
      console.log('Received a message in reservation_canceled queue:', msg.content.toString());
      logMessage('reservation_canceled', msg.content.toString());
    });

  } catch (err) {
    console.error('Failed to connect to RabbitMQ:', err);
  }
};

consumeMessages();

app.listen(port, () => {
  console.log(`Service running on http://localhost:${port}`);
});
