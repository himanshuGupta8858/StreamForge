const { getChannel } = require('../config/rabbitmq');
const { sendEmail } = require('../services/emailService');

const QUEUE = 'music.uploads.queue';

/**
 * Start consuming MUSIC_UPLOADED events from RabbitMQ.
 * Sends email notifications to the artist and to their subscribers.
 */
const startMusicConsumer = async () => {
  try {
    const channel = getChannel();

    if (!channel) {
      console.error('❌ Cannot start music consumer — RabbitMQ channel not available');
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
          console.log(`   Song:   ${data.songTitle}`);
          console.log(`   Artist: ${data.artistName} (${data.artistEmail})`);
          console.log(`   Subscribers: ${data.subscriberEmails.length}`);

          if (event === 'MUSIC_UPLOADED') {
            // 1. Send confirmation email to the artist
            await sendArtistConfirmation(data.artistName, data.artistEmail, data.songTitle);
            
            // 2. Send notification email to each subscriber
            if (data.subscriberEmails && data.subscriberEmails.length > 0) {
              const emailPromises = data.subscriberEmails.map((subEmail) =>
                sendSubscriberNotification(subEmail, data.artistName, data.songTitle)
              );
              await Promise.all(emailPromises);
            }
            
            console.log(`✅ Completed notifications for "${data.songTitle}"`);
          }

          // Acknowledge message
          channel.ack(msg);
        } catch (error) {
          console.error('❌ Error processing music message:', error.message);

          // Handle retry or discard
          if (msg.fields.redelivered) {
            channel.nack(msg, false, false); // discard
            console.warn('⚠️  Music message dead-lettered after failure');
          } else {
            channel.nack(msg, false, true); // requeue
            console.warn('🔄 Music message requeued for retry');
          }
        }
      },
      { noAck: false }
    );
  } catch (error) {
    console.error('❌ Failed to start music consumer:', error.message);
  }
};

/**
 * Helper to send email to the artist.
 */
const sendArtistConfirmation = async (artistName, artistEmail, songTitle) => {
  const subject = `Music Upload Confirmed: "${songTitle}"`;
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0; font-family: sans-serif; background-color: #0f0f23; color: #ffffff;">
      <div style="max-width: 600px; margin: 40px auto; padding: 30px; background: #1a1a2e; border-radius: 16px; border: 1px solid rgba(102,126,234,0.3);">
        <h2 style="color: #1DB954;">Congratulations! 🎉</h2>
        <p>Hi <strong>${artistName}</strong>,</p>
        <p>Your song <strong>"${songTitle}"</strong> has been successfully uploaded and is now available on Spotify!</p>
        <p>Your subscribers have been notified immediately.</p>
        <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 20px 0;">
        <p style="color: #6c7983; font-size: 13px;">Thank you for releasing your music with us.</p>
      </div>
    </body>
    </html>
  `;
  await sendEmail(artistEmail, subject, htmlBody);
};

/**
 * Helper to send email to a subscriber.
 */
const sendSubscriberNotification = async (subscriberEmail, artistName, songTitle) => {
  const subject = `New Music from ${artistName}: "${songTitle}"`;
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0; font-family: sans-serif; background-color: #0f0f23; color: #ffffff;">
      <div style="max-width: 600px; margin: 40px auto; padding: 30px; background: #1a1a2e; border-radius: 16px; border: 1px solid rgba(102,126,234,0.3);">
        <h2 style="color: #1DB954;">New Music Released! 🎵</h2>
        <p>Hi there,</p>
        <p>An artist you follow, <strong>${artistName}</strong>, just released a brand new song: <strong>"${songTitle}"</strong>!</p>
        <p>Click below to open the music player and listen now:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/search" 
             style="display: inline-block; padding: 14px 30px; background-color: #1DB954; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 30px;">
            Listen Now
          </a>
        </div>
        <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 20px 0;">
        <p style="color: #6c7983; font-size: 13px;">You are receiving this because you follow ${artistName}.</p>
      </div>
    </body>
    </html>
  `;
  await sendEmail(subscriberEmail, subject, htmlBody);
};

module.exports = { startMusicConsumer };
