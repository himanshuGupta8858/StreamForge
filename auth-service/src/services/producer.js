const { getChannel } = require('../config/rabbitmq');

const EXCHANGE = 'user.events';
const ROUTING_KEY = 'user.registered';

/**
 * Publish a USER_REGISTERED event to RabbitMQ.
 * Called after successful user registration.
 *
 * @param {object} userData - { name, email }
 */
const publishUserRegistered = async (userData) => {
  try {
    const channel = getChannel();

    if (!channel) {
      console.warn('⚠️  RabbitMQ channel not available. Event not published.');
      return;
    }

    const message = {
      event: 'USER_REGISTERED',
      data: {
        name: userData.name,
        email: userData.email,
      },
      timestamp: new Date().toISOString(),
    };

    channel.publish(
      EXCHANGE,
      ROUTING_KEY,
      Buffer.from(JSON.stringify(message)),
      {
        persistent: true, // Survive broker restarts
        contentType: 'application/json',
      }
    );

    console.log(`📤 USER_REGISTERED event published for: ${userData.email}`);
  } catch (error) {
    console.error('❌ Failed to publish USER_REGISTERED event:', error.message);
  }
};

module.exports = { publishUserRegistered };
