const amqplib = require('amqplib');

let channel = null;
let connection = null;

/**
 * Connect to RabbitMQ (CloudAMQP) and create a channel.
 * Sets up the exchange, queue, and binding for user events.
 */
const connectRabbitMQ = async () => {
  try {
    connection = await amqplib.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    // Declare a topic exchange for user events
    await channel.assertExchange('user.events', 'topic', { durable: true });

    // Declare the registration queue
    await channel.assertQueue('user.registration.queue', { durable: true });

    // Bind queue to exchange with routing key
    await channel.bindQueue(
      'user.registration.queue',
      'user.events',
      'user.registered'
    );

    console.log('✅ RabbitMQ connected & channel created');

    // Handle connection errors
    connection.on('error', (err) => {
      console.error('❌ RabbitMQ connection error:', err.message);
      channel = null;
      setTimeout(connectRabbitMQ, 5000);
    });

    connection.on('close', () => {
      console.warn('⚠️  RabbitMQ connection closed. Reconnecting...');
      channel = null;
      setTimeout(connectRabbitMQ, 5000);
    });
  } catch (error) {
    console.error('❌ RabbitMQ connection failed:', error.message);
    setTimeout(connectRabbitMQ, 5000);
  }
};

/**
 * Get the current RabbitMQ channel.
 * @returns {object|null} The AMQP channel instance
 */
const getChannel = () => channel;

module.exports = { connectRabbitMQ, getChannel };
