const { getChannel } = require('../config/rabbitmq');
const { sendWelcomeEmail } = require('../services/emailService');

const QUEUE = 'user.registration.queue';

/**
 * Start consuming USER_REGISTERED events from RabbitMQ.
 * For each event, sends a welcome email via Gmail API.
 */
const startUserConsumer = async () => {
  try {
    const channel = getChannel();

    if (!channel) {
      console.error('❌ Cannot start consumer — RabbitMQ channel not available');
      return;
    }

    console.log(`📥 Listening for messages on queue: ${QUEUE}`);

    channel.consume(
      QUEUE,
      async (msg) => {
        if (!msg) return;

        try {
          const content = JSON.parse(msg.content.toString());
          const { event, data } = content;

          console.log(`\n📨 Received event: ${event}`);
          console.log(`   Name:  ${data.name}`);
          console.log(`   Email: ${data.email}`);

          if (event === 'USER_REGISTERED') {
            // Send welcome email via Gmail API
            await sendWelcomeEmail(data.name, data.email);
            console.log(`✅ Welcome email sent to ${data.email}`);
          }

          // Acknowledge the message
          channel.ack(msg);
        } catch (error) {
          console.error('❌ Error processing message:', error.message);

          // Reject and requeue on failure (with a limit to prevent infinite loops)
          if (msg.fields.redelivered) {
            // Already retried once — dead-letter it
            channel.nack(msg, false, false);
            console.warn('⚠️  Message dead-lettered after retry failure');
          } else {
            // Requeue for one retry
            channel.nack(msg, false, true);
            console.warn('🔄 Message requeued for retry');
          }
        }
      },
      { noAck: false } // Manual acknowledgment
    );
  } catch (error) {
    console.error('❌ Failed to start user consumer:', error.message);
  }
};

module.exports = { startUserConsumer };
