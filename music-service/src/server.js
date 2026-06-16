require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const { connectRabbitMQ } = require('./config/rabbitmq');

const PORT = process.env.PORT || 5002;

/**
 * Start the Music Service:
 * 1. Connect to MongoDB
 * 2. Connect to RabbitMQ
 * 3. Start Express server
 */
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Connect to RabbitMQ
    connectRabbitMQ();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`\n🚀 Music Service running on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Health: http://localhost:${PORT}/health\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start Music Service:', error.message);
    process.exit(1);
  }
};

startServer();
