require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const { connectRabbitMQ } = require('./config/rabbitmq');

const PORT = process.env.PORT || 5000;

/**
 * Start the Auth Service:
 * 1. Connect to MongoDB
 * 2. Connect to RabbitMQ
 * 3. Start Express server
 */
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Connect to RabbitMQ (non-blocking — will retry on failure)
    connectRabbitMQ();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`\n🚀 Auth Service running on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Health: http://localhost:${PORT}/health\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start Auth Service:', error.message);
    process.exit(1);
  }
};

startServer();
