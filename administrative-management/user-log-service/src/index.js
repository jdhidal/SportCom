const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const amqp = require('amqplib');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { graphqlHTTP } = require('express-graphql');
const schema = require('./schema'); // Importar el esquema de GraphQL

dotenv.config();

const app = express();

// Cargar documentación de Swagger
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Middleware
app.use(express.json());
app.use(cors()); // Habilitar CORS

// Ruta para el archivo de log en el mismo nivel que 'src'
const logFilePath = path.join(__dirname, 'users_log.txt');

// Consumidor RabbitMQ
const consumeMessages = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertQueue('user-created');
    await channel.assertQueue('user-login');

    const logMessage = (queue, messageContent) => {
      const logEntry = `${new Date().toISOString()} [${queue}]: ${messageContent}\n`;
      fs.appendFile(logFilePath, logEntry, (err) => {
        if (err) {
          console.error('Failed to write message to file:', err);
        } else {
          console.log('Message logged to users_log.txt');
        }
      });
    };

    channel.consume('user-created', (msg) => {
      if (msg !== null) {
        console.log('Received a message in user-created:', msg.content.toString());
        logMessage('user-created', msg.content.toString());
        channel.ack(msg);
      }
    });

    channel.consume('user-login', (msg) => {
      if (msg !== null) {
        console.log('Received a message in user-login queue:', msg.content.toString());
        logMessage('user-login', msg.content.toString());
        channel.ack(msg);
      }
    });

  } catch (err) {
    console.error('Failed to connect to RabbitMQ:', err);
  }
};

consumeMessages();

// Integrar GraphQL
app.use('/graphql', graphqlHTTP({
  schema,
  graphiql: true, // Habilitar GraphiQL para pruebas
}));

const port = process.env.PORT || 3019;
app.listen(port, () => {
  console.log(`Service running on http://localhost:${port}/graphql`);
});
