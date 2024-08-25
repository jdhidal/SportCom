const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const amqp = require('amqplib');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');

dotenv.config();

const app = express();


const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Middleware
app.use(express.json());
app.use(cors()); // Enable CORS


const logFilePath = path.join(__dirname, 'availability_log.txt');


const mongoUri = process.env.MONGO_URI;
const dbName = 'sportcom_logs'; 
const collectionName = 'availability_logs'; 


let db;
MongoClient.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    db = client.db(dbName);
    console.log(`Connected to MongoDB Atlas: ${dbName}`);
  })
  .catch(error => console.error('Failed to connect to MongoDB Atlas:', error));

// Consumer RabbitMQ
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

      // Save on file
      const logEntry = `${new Date().toISOString()} [${queue}]: ${messageContent}\n`;
      fs.appendFile(logFilePath, logEntry, (err) => {
        if (err) {
          console.error('Failed to write message to file:', err);
        } else {
          console.log('Message logged to availability_log.txt');
        }
      });

      // Save MongoDB Atlas
      const logData = {
        timestamp: new Date().toISOString(),
        queueName: queue,
        messageContent: messageContent
      };

      if (db) {
        db.collection(collectionName).insertOne(logData)
          .then(result => {
            console.log('Message logged to MongoDB Atlas');
          })
          .catch(error => {
            console.error('Failed to log message to MongoDB Atlas:', error);
          });
      } else {
        console.error('MongoDB connection is not established.');
      }
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


app.get('/api/availability-logs', (req, res) => {
    fs.readFile(logFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Failed to read log file:', err);
            return res.status(500).json({ error: 'Failed to read log file' });
        }

        // Convert array
        const logs = data.trim().split('\n').map(log => {
            const [timestamp, queueName, messageContent] = log.match(/\[(.*?)\]\s*:\s*(.*)/).slice(1);
            return { timestamp, queueName, messageContent };
        });

        res.status(200).json(logs);
    });
});

const port = process.env.PORT || 3016;
app.listen(port, () => {
  console.log(`Service running on http://localhost:${port}`);
});
