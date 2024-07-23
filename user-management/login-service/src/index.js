// login-service/src/index.js

const express = require('express');
const jwt = require('jsonwebtoken');
const sql = require('mssql');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const amqp = require('amqplib/callback_api');

dotenv.config();

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser()); // Cookie middleware

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

// RabbitMQ configuration
const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
const CreatQueue = 'user-created';
const loginQueue = 'user-login';

// RabbitMQ consumer to listen for messages (if needed)
const consumeMessages = () => {
  amqp.connect(rabbitUrl, (error0, connection) => {
    if (error0) {
      console.error('RabbitMQ connection error:', error0);
      return;
    }
    console.log('Connected to RabbitMQ');
    
    connection.createChannel((error1, channel) => {
      if (error1) {
        console.error('RabbitMQ channel error:', error1);
        return;
      }
      console.log('Channel created');
      
      channel.assertQueue(CreatQueue, { durable: true }, (error2) => {
        if (error2) {
          console.error('Error asserting queue:', error2);
          return;
        }
        console.log('Queue asserted');
        
        channel.consume(CreatQueue, (msg) => {
          if (msg !== null) {
            const message = JSON.parse(msg.content.toString());
            console.log(" [x] Received %s", message);
            
            // Here you can perform actions based on the received message
            // For example, you can update some state or notify other services

            channel.ack(msg);
          }
        });
      });
    });
  });
};

// Login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    await sql.connect(dbConfig);

    // Verifica las credenciales del usuario
    const result = await sql.query`EXEC dbo.AuthenticateUser @email=${email}, @password=${password}`;

    if (result.recordset.length === 0 || result.recordset[0].IsAuthenticated !== 1) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const userResult = await sql.query`SELECT password FROM Users WHERE email = ${email}`;
    
    if (userResult.recordset.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const storedPassword = userResult.recordset[0].password;
    const match = await bcrypt.compare(password, storedPassword);

    if (match) {
      const token = jwt.sign({ email: email }, process.env.JWT_SECRET, { expiresIn: '1h' });

      res.cookie('token', token, { httpOnly: true, maxAge: 3600000 }); 
      res.json({ message: 'Login successful' });

      // Conecta a RabbitMQ y envía el mensaje a la cola de login
      amqp.connect(rabbitUrl, (error0, connection) => {
        if (error0) {
          console.error('RabbitMQ connection error:', error0);
          return res.status(500).json({ error: 'Error connecting to RabbitMQ' });
        }

        connection.createChannel((error1, channel) => {
          if (error1) {
            console.error('RabbitMQ channel error:', error1);
            return res.status(500).json({ error: 'Error creating RabbitMQ channel' });
          }

          channel.assertQueue(loginQueue, { durable: true }, (error2) => {
            if (error2) {
              console.error('Error asserting queue:', error2);
              return res.status(500).json({ error: 'Error asserting RabbitMQ queue' });
            }

            const message = JSON.stringify({ email, token });
            channel.sendToQueue(loginQueue, Buffer.from(message));
            console.log(" [x] Sent %s", message);
            
            // Cierra la conexión después de un breve retardo
            setTimeout(() => {
              connection.close();
            }, 500);
          });
        });
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    sql.close();
  }
});


app.listen(port, () => {
  console.log(`Authentication service running on http://localhost:${port}`);
  consumeMessages(); // Start listening to RabbitMQ messages if needed
});
