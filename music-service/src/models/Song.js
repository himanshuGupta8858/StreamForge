const mongoose = require('mongoose');

const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Song title is required'],
      trim: true,
    },
    artistName: {
      type: String,
      required: [true, 'Artist name is required'],
      trim: true,
    },
    coverImageUrl: {
      type: String,
      required: [true, 'Cover image is required'], // S3 Key or URL
    },
    audioUrl: {
      type: String,
      required: [true, 'Audio file is required'], // S3 Key
    },
    duration: {
      type: Number,
      required: [true, 'Song duration is required'], // in seconds
    },
    genre: {
      type: String,
      required: [true, 'Genre is required'],
      trim: true,
    },
    playlistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Playlist',
      default: null,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Song', songSchema);
