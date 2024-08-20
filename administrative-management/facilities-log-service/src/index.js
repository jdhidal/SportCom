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

// Cargar documentación de Swagger
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Middleware
app.use(express.json());
app.use(cors()); // Habilitar CORS

// Ruta para el archivo de log en el mismo nivel que 'src'
const logFilePath = path.join(__dirname, 'facilities_log.txt');

// Consumidor RabbitMQ
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

      // Guardar el mensaje en un archivo de texto plano
      const logEntry = `${new Date().toISOString()} [${queue}]: ${messageContent}\n`;
      fs.appendFile(logFilePath, logEntry, (err) => { // Ruta del archivo de log en el mismo nivel que 'src'
        if (err) {
          console.error('Failed to write message to file:', err);
        } else {
          console.log('Message logged to facilities_log.txt');
        }
      });
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

// Nueva ruta para obtener los logs de facilities
app.get('/api/facility-logs', (req, res) => {
    fs.readFile(logFilePath, 'utf8', (err, data) => { // Ruta del archivo de log en el mismo nivel que 'src'
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

const port = process.env.PORT || 3017;
app.listen(port, () => {
  console.log(`Service running on http://localhost:${port}`);
});