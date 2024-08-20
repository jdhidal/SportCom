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
const logFilePath = path.join(__dirname, 'availability_log.txt');

// Consumidor RabbitMQ
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

      // Guardar el mensaje en un archivo de texto plano
      const logEntry = `${new Date().toISOString()} [${queue}]: ${messageContent}\n`;
      fs.appendFile(logFilePath, logEntry, (err) => { // Ruta del archivo de log en el mismo nivel que 'src'
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

// Nueva ruta para obtener los logs de disponibilidad
app.get('/api/availability-logs', (req, res) => {
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

const port = process.env.PORT || 3016;
app.listen(port, () => {
  console.log(`Service running on http://localhost:${port}`);
});
