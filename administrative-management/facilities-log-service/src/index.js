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


const logFilePath = path.join(__dirname, 'facilities_log.txt');


const mongoUri = process.env.MONGO_URI;
const dbName = 'sportcom_logs_facilities'; 
const collectionName = 'facilities_logs'; 


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
    await channel.assertQueue('facility_created');
    await channel.assertQueue('facility_updated');
    await channel.assertQueue('facility_deleted');

    const logMessage = (queue, msg) => {
      const messageContent = msg.content.toString();
      console.log(`Received a message in ${queue} queue:`, messageContent);

      
      const logEntry = `${new Date().toISOString()} [${queue}]: ${messageContent}\n`;
      fs.appendFile(logFilePath, logEntry, (err) => {
        if (err) {
          console.error('Failed to write message to file:', err);
        } else {
          console.log('Message logged to facilities_log.txt');
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

    channel.consume('facility_created', (msg) => {
      logMessage('facility_created', msg);
    });

    channel.consume('facility_updated', (msg) => {
      logMessage('facility_updated', msg);
    });

    channel.consume('facility_deleted', (msg) => {
      logMessage('facility_deleted', msg);
    });

  } catch (err) {
    console.error('Failed to connect to RabbitMQ:', err);
  }
};

consumeMessages();


app.get('/api/facility-logs', (req, res) => {
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

const port = process.env.PORT || 3017;
app.listen(port, () => {
  console.log(`Service running on http://localhost:${port}`);
});
