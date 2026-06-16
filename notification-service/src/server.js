require('dotenv').config();

const app = require('./app');
const { connectRabbitMQ } = require('./config/rabbitmq');
const { startUserConsumer } = require('./consumers/userConsumer');
const { startMusicConsumer } = require('./consumers/musicConsumer');

const PORT = process.env.PORT || 5001;

/**
 * Start the Notification Service:
 * 1. Connect to RabbitMQ
 * 2. Start event consumers
 * 3. Start Express server (health check)
 */
const startServer = async () => {
  try {
    // Connect to RabbitMQ
    const channel = await connectRabbitMQ();

    if (channel) {
      // Start consuming events
      await startUserConsumer();
      await startMusicConsumer();
    } else {
      console.warn('⚠️  RabbitMQ not ready — consumer will start on reconnect');
    }

    // Start Express server
    app.listen(PORT, () => {
      console.log(`\n🔔 Notification Service running on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Health: http://localhost:${PORT}/health\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start Notification Service:', error.message);
    process.exit(1);
  }
};

startServer();
