const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const mysql = require('mysql2/promise');
const amqp = require('amqplib');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();

const app = express();
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(express.json());
app.use(cors());

// Database connection function
const connectToDatabase = async () => {
    return mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE
    });
};

// RabbitMQ connection function
const connectToRabbitMQ = async () => {
    const conn = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await conn.createChannel();
    await channel.assertQueue('facility_deleted');
    return { conn, channel };
};

// Endpoint to delete a facility
app.delete('/facilities/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const connection = await connectToDatabase();
        const [result] = await connection.execute('CALL DeleteFacility(?)', [id]);
        await connection.end(); // Close MySQL connection

        if (result[0][0].RowsAffected === 0) {
            return res.status(404).json({ message: 'Facility not found' });
        }

        const { conn, channel } = await connectToRabbitMQ();
        channel.sendToQueue('facility_deleted', Buffer.from(JSON.stringify({ id })));
        await channel.close();
        await conn.close();

        res.status(200).json({ id });
    } catch (err) {
        console.error('Error processing request:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

const port = process.env.PORT || 3006;
app.listen(port, () => {
    console.log(`Service running on http://localhost:${port}`);
});
