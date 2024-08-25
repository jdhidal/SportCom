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
app.use(cors()); 


const logFilePath = path.join(__dirname, 'reservation_log.txt');


const mongoUri = process.env.MONGO_URI;
const dbName = 'sportcom_logs_reservation'; 
const collectionName = 'reservation_logs'; 


let db;
MongoClient.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    db = client.db(dbName);
    console.log(`Connected to MongoDB Atlas: ${dbName}`);
  })
  .catch(error => console.error('Failed to connect to MongoDB Atlas:', error));


const consumeMessages = async () => {
  try {
    const conn = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await conn.createChannel();
    await channel.assertQueue('reservation_created');
    await channel.assertQueue('reservation_deleted');
    await channel.assertQueue('reservation_canceled');

    const logMessage = (queue, messageContent) => {
      const logEntry = `${new Date().toISOString()} [${queue}]: ${messageContent}\n`;
      
      
      fs.appendFile(logFilePath, logEntry, (err) => {
        if (err) {
          console.error('Failed to write message to file:', err);
        } else {
          console.log('Message logged to reservation_log.txt');
        }
      });

      
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


app.get('/api/reservation-logs', (req, res) => {
  fs.readFile(logFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read log file:', err);
      return res.status(500).json({ error: 'Failed to read log file' });
    }

    
    const logs = data.trim().split('\n').map(log => {
      const [timestamp, queueName, messageContent] = log.match(/\[(.*?)\]\s*:\s*(.*)/).slice(1);
      return { timestamp, queueName, messageContent };
    });

    res.status(200).json(logs);
  });
});

const port = process.env.PORT || 3018;
app.listen(port, () => {
  console.log(`Service running on http://localhost:${port}`);
});
