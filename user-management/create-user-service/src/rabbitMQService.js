// rabbitMQService.js

require('dotenv').config();

const amqp = require('amqplib');

const sendMessageToQueue = async (queue, message) => {
  const conn = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await conn.createChannel();
  await channel.assertQueue(queue);
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
  console.log(`Message sent to RabbitMQ queue ${queue}`);
  await channel.close();
  await conn.close();
};

module.exports = { sendMessageToQueue };
