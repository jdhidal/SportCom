const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const amqp = require('amqplib');

dotenv.config();

const app = express();

// Middleware
const corsOptions = {
  origin: 'https://frontend-sportcom-f6a797569cc5.herokuapp.com', // The URL of frontend
  credentials: true
};
app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(cookieParser()); // Cookie middleware

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
};


// Login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);

    
    const [result] = await connection.execute(
      'CALL AuthenticateUser(?)', 
      [email]
    );

    if (result[0][0].UserExists !== 1) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    
    const [userResult] = await connection.execute(
      'SELECT password FROM users WHERE email = ?',
      [email]
    );

    if (userResult.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const storedPassword = userResult[0].password;

    
    const match = await bcrypt.compare(password, storedPassword);

    if (match) {
      const token = jwt.sign({ email: email }, process.env.JWT_SECRET, { expiresIn: '1h' });

      res.cookie('token', token, { 
        httpOnly: true, // La cookie no será accesible desde el frontend
        maxAge: 3600000, // La cookie expirará en 1 hora (3600000 ms)
        sameSite: 'None', // Permite el envío de cookies entre sitios (necesario si trabajas con CORS)
        secure: false // Cambia a true si tu aplicación está en HTTPS
      });
      res.json({ message: 'Logged in successfully' });
   
      
      const conn = await amqp.connect(process.env.RABBITMQ_URL);
      const channel = await conn.createChannel();
      await channel.assertQueue('user-login');
      channel.sendToQueue('user-login', Buffer.from(JSON.stringify({email, token})));
      console.log('Message sent to RabbitMQ');
    
      
      await channel.close();
      await conn.close();

    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }

    connection.end();
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Authentication service running on http://localhost:${port}`);
});
