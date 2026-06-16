const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create combined unique index to prevent duplicate follows
subscriptionSchema.index({ userId: 1, artistId: 1 }, { unique: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
