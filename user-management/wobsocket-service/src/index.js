const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.json());

// Load Swagger YAML
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

// Configure Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// WebSocket Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.query.token;

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return next(new Error('Authentication error'));
      }
      socket.user = decoded;
      next();
    });
  } else {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });

  // Handle incoming messages
  socket.on('message', (data) => {
    console.log('Message received:', data);
    // Broadcast message to other clients
    io.emit('message', data);
  });
});

const port = process.env.PORT || 3003;
server.listen(port, () => {
  console.log(`WebSocket service running on http://localhost:${port}`);
});
