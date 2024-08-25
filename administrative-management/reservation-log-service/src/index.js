const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const amqp = require('amqplib');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb'); // Importar MongoClient para MongoDB

dotenv.config();

const app = express();

// Cargar documentación de Swagger
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Middleware
app.use(express.json());
app.use(cors()); // Habilitar CORS

// Ruta para el archivo de log en el mismo nivel que 'src'
const logFilePath = path.join(__dirname, 'reservation_log.txt');

// Configuración de MongoDB
const mongoUri = process.env.MONGO_URI;
const dbName = 'sportcom_logs_reservation'; // Nombre de la base de datos
const collectionName = 'reservation_logs'; // Nombre de la colección

// Conectar a MongoDB Atlas
let db;
MongoClient.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    db = client.db(dbName);
    console.log(`Connected to MongoDB Atlas: ${dbName}`);
  })
  .catch(error => console.error('Failed to connect to MongoDB Atlas:', error));

// Consumidor RabbitMQ
const consumeMessages = async () => {
  try {
    const conn = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await conn.createChannel();
    await channel.assertQueue('reservation_created');
    await channel.assertQueue('reservation_deleted');
    await channel.assertQueue('reservation_canceled');

    const logMessage = (queue, messageContent) => {
      const logEntry = `${new Date().toISOString()} [${queue}]: ${messageContent}\n`;
      
      // Guardar el mensaje en un archivo de texto plano
      fs.appendFile(logFilePath, logEntry, (err) => {
        if (err) {
          console.error('Failed to write message to file:', err);
        } else {
          console.log('Message logged to reservation_log.txt');
        }
      });

      // Guardar el mensaje en MongoDB Atlas
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

// Nueva ruta para obtener los logs de reservas
app.get('/api/reservation-logs', (req, res) => {
  fs.readFile(logFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read log file:', err);
      return res.status(500).json({ error: 'Failed to read log file' });
    }

    // Convertir el contenido del archivo en un array de entradas de log
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
