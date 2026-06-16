const amqplib = require('amqplib');

let channel = null;
let connection = null;

/**
 * Connect to RabbitMQ (CloudAMQP) for the Notification Service.
 * Sets up the exchange, queue, and binding.
 * @returns {Promise<object>} The AMQP channel
 */
const connectRabbitMQ = async () => {
  try {
    connection = await amqplib.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    // Declare exchange and queue (idempotent — safe if already exists)
    await channel.assertExchange('user.events', 'topic', { durable: true });
    await channel.assertQueue('user.registration.queue', { durable: true });
    await channel.bindQueue(
      'user.registration.queue',
      'user.events',
      'user.registered'
    );

    // Assert and bind music events queue
    await channel.assertExchange('music.events', 'topic', { durable: true });
    await channel.assertQueue('music.uploads.queue', { durable: true });
    await channel.bindQueue(
      'music.uploads.queue',
      'music.events',
      'music.uploaded'
    );

    // Prefetch 1 message at a time for fair dispatch
    await channel.prefetch(1);

    console.log('✅ RabbitMQ connected (Notification Service)');

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

    return channel;
  } catch (error) {
    console.error('❌ RabbitMQ connection failed:', error.message);
    setTimeout(connectRabbitMQ, 5000);
    return null;
  }
};

/**
 * Get the current RabbitMQ channel.
 * @returns {object|null}
 */
const getChannel = () => channel;

module.exports = { connectRabbitMQ, getChannel };
