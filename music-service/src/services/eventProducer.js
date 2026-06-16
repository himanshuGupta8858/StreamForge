const { getChannel } = require('../config/rabbitmq');

/**
 * Publish MUSIC_UPLOADED event to RabbitMQ.
 * @param {object} data - The event details (songTitle, artistName, artistEmail, subscriberEmails)
 */
const publishMusicUploaded = async (data) => {
  try {
    const channel = getChannel();
    if (!channel) {
      console.error('❌ RabbitMQ channel not available — cannot publish event');
      return;
    }

    const exchange = 'music.events';
    const routingKey = 'music.uploaded';
    const content = {
      event: 'MUSIC_UPLOADED',
      data,
    };

    channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(content)),
      { persistent: true }
    );

    console.log(`📤 Event published: MUSIC_UPLOADED for "${data.songTitle}" by artist: ${data.artistName}`);
  } catch (error) {
    console.error('❌ Failed to publish MUSIC_UPLOADED event:', error.message);
  }
};

module.exports = {
  publishMusicUploaded,
};
