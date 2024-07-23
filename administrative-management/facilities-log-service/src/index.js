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
const port = 3017; // Port for listing service

const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(express.json());
app.use(cors()); // Enable CORS

// Dummy endpoint to return a message
app.get('/facilities', (req, res) => {
    res.status(200).json({ message: 'No facilities available' });
});

// RabbitMQ consumer
const consumeMessages = async () => {
    try {
        const conn = await amqp.connect(process.env.RABBITMQ_URL);
        const channel = await conn.createChannel();
        await channel.assertQueue('facility_created');
        await channel.assertQueue('facility_updated');
        await channel.assertQueue('facility_deleted');

        const logMessage = (msg, queueName) => {
            const messageContent = msg.content.toString();
            const logEntry = `${new Date().toISOString()} [${queueName}]: ${messageContent}\n`;
            fs.appendFile('facilities_log.txt', logEntry, (err) => {
                if (err) {
                    console.error('Failed to write message to file:', err);
                } else {
                    console.log('Message logged to facilities_log.txt');
                }
            });
        };

        channel.consume('facility_created', (msg) => {
            logMessage(msg, 'facility_created');
        });

        channel.consume('facility_updated', (msg) => {
            logMessage(msg, 'facility_updated');
        });

        channel.consume('facility_deleted', (msg) => {
            logMessage(msg, 'facility_deleted');
        });

    } catch (err) {
        console.error('Failed to connect to RabbitMQ:', err);
    }
};

consumeMessages();

app.listen(port, () => {
    console.log(`Service running on http://localhost:${port}`);
});
