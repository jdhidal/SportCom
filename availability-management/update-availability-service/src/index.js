const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const sql = require('mssql');
const amqp = require('amqplib');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();

const app = express();
const port = 3014; // Port for update-availability-service

const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(express.json());
app.use(cors()); // Enable CORS

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true, // For Azure SQL or other encrypted databases
        trustServerCertificate: true // Trust the server's certificate
    }
};

// Create a connection pool
const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('Connected to MSSQL');
        return pool;
    })
    .catch(err => {
        console.error('Database connection failed:', err);
        process.exit(1);
    });

app.put('/availability/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { start_date, end_date, spots, cost } = req.body;
        const pool = await poolPromise;

        await pool.request()
            .input('id', sql.Int, id)
            .input('start_date', sql.Date, start_date)
            .input('end_date', sql.Date, end_date)
            .input('spots', sql.Int, spots)
            .input('cost', sql.Decimal(10, 2), cost)
            .execute('sp_UpdateAvailability'); // Name of the stored procedure

        // Send message to RabbitMQ
        const conn = await amqp.connect(process.env.RABBITMQ_URL);
        const channel = await conn.createChannel();
        await channel.assertQueue('availability_updated');
        channel.sendToQueue('availability_updated', Buffer.from(JSON.stringify({ id, start_date, end_date, spots, cost })));
        console.log('Message sent to RabbitMQ');

        res.status(200).send('Availability updated');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.listen(port, () => {
    console.log(`Update Availability Service running on http://localhost:${port}`);
});
