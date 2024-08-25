const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const cors = require('cors');
const path = require('path');
const { connectToDatabase } = require('./databaseService');
const { sendMessageToQueue } = require('./rabbitMQService');
const { port } = require('./config');

const app = express();
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(express.json());
app.use(cors()); // Enable CORS

// Endpoint to update availability
app.put('/availability/:id', async (req, res) => {
  const { id } = req.params;
  const { start_date, end_date, spots, cost } = req.body;

  if (!start_date || !end_date || !spots || !cost) {
    return res.status(400).send('All fields are required');
  }

  let connection;
  try {
    connection = await connectToDatabase();

    // Execute stored procedure
    const [result] = await connection.execute(
      'CALL sp_UpdateAvailability(?, ?, ?, ?, ?)', 
      [id, start_date, end_date, spots, cost]
    );
    console.log('Availability updated:', result);

    // Send message to RabbitMQ
    await sendMessageToQueue('availability_updated', { id, start_date, end_date, spots, cost });

    res.status(200).send('Availability updated');
  } catch (err) {
    res.status(500).send(err.message);
  } finally {
    if (connection) {
      await connection.end(); // Close MySQL connection
    }
  }
});

app.listen(port, () => {
  console.log(`Update Availability Service running on http://localhost:${port}`);
});
