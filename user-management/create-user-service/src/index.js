// app.js
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const cors = require('cors');
const { createUser } = require('./userController');

require('dotenv').config();

const app = express();

// Middleware CORS
app.use(cors());

// Middleware para manejar JSON
app.use(express.json());

// Cargar Swagger YAML
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

// Configurar Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Endpoint para crear usuarios
app.post('/create', createUser);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Service running on http://localhost:${port}`);
});
