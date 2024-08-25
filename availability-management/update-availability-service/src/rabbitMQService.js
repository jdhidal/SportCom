// rabbitMQService.js
const amqp = require('amqplib');
const { rabbitMQUrl } = require('./config');

const sendMessageToQueue = async (queue, message) => {
  const conn = await amqp.connect(rabbitMQUrl);
  const channel = await conn.createChannel();
  await channel.assertQueue(queue);
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
  console.log(`Message sent to RabbitMQ queue ${queue}`);
  await channel.close();
  await conn.close();
};

module.exports = { sendMessageToQueue };
