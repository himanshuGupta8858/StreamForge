const playlistRepository = require('../repositories/playlistRepository');
const songRepository = require('../repositories/songRepository');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const s3Service = require('./s3Service');
const eventProducer = require('./eventProducer');

class MusicService {
  /**
   * Create a playlist.
   */
  async createPlaylist(title, description, coverImageFile, artistId, artistName) {
    if (!coverImageFile) {
      throw new Error('Cover image is required');
    }

    // 1. Upload cover to S3
    const s3Key = await s3Service.uploadImageToS3(
      coverImageFile.buffer,
      coverImageFile.originalname,
      coverImageFile.mimetype
    );

    // 2. Save metadata in MongoDB
    const playlist = await playlistRepository.create({
      title,
      description,
      coverImageUrl: s3Key, // Store S3 Key
      artistId,
      artistName,
      songs: [],
    });

    return playlist;
  }

  /**
   * Upload music.
   */
  async uploadSong(songData, audioFile, coverImageFile, userId, artistName) {
    if (!audioFile || !coverImageFile) {
      throw new Error('Both audio and cover image files are required');
    }

    const { title, duration, genre, playlistId } = songData;

    // 1. Upload files to S3
    const audioKey = await s3Service.uploadAudioToS3(
      audioFile.buffer,
      audioFile.originalname,
      audioFile.mimetype
    );

    const coverKey = await s3Service.uploadImageToS3(
      coverImageFile.buffer,
      coverImageFile.originalname,
      coverImageFile.mimetype
    );

    // 2. Save metadata in MongoDB
    const song = await songRepository.create({
      title,
      artistName,
      coverImageUrl: coverKey,
      audioUrl: audioKey,
      duration: Number(duration),
      genre,
      playlistId: playlistId || null,
      uploadedBy: userId,
    });

    // 3. If part of a playlist, add song to the playlist
    if (playlistId) {
      await playlistRepository.addSongToPlaylist(playlistId, song._id);
    }

    // 4. Notify subscribers
    try {
      // Find artist's email
      const artist = await User.findById(userId);
      const artistEmail = artist ? artist.email : '';

      // Find all subscribers following this artist
      const subscriptions = await Subscription.find({ artistId: userId }).populate('userId');
      const subscriberEmails = subscriptions
        .map(sub => sub.userId ? sub.userId.email : null)
        .filter(email => email !== null);

      // Publish MUSIC_UPLOADED event
      await eventProducer.publishMusicUploaded({
        songTitle: song.title,
        artistName,
        artistEmail,
        subscriberEmails,
      });
    } catch (err) {
      console.error('⚠️ Failed to send subscriber notifications on upload:', err.message);
    }

    return song;
  }

  /**
   * Get playlist details and generate pre-signed URLs for covers and songs.
   */
  async getPlaylistDetails(playlistId) {
    const playlist = await playlistRepository.findById(playlistId);
    if (!playlist) return null;

    // Generate pre-signed URL for cover image
    playlist.coverImageUrl = await s3Service.generateSignedUrl(playlist.coverImageUrl);

    // Generate pre-signed URLs for songs in the playlist
    if (playlist.songs && playlist.songs.length > 0) {
      playlist.songs = await Promise.all(
        playlist.songs.map(async (song) => {
          song.coverImageUrl = await s3Service.generateSignedUrl(song.coverImageUrl);
          song.audioUrl = await s3Service.generateSignedUrl(song.audioUrl);
          return song;
        })
      );
    }

    return playlist;
  }

  /**
   * Get song details and generate pre-signed URLs.
   */
  async getSongDetails(songId) {
    const song = await songRepository.findById(songId);
    if (!song) return null;

    song.coverImageUrl = await s3Service.generateSignedUrl(song.coverImageUrl);
    song.audioUrl = await s3Service.generateSignedUrl(song.audioUrl);

    return song;
  }

  /**
   * Get all playlists and pre-sign their cover images.
   */
  async getAllPlaylists() {
    const playlists = await playlistRepository.findAll();
    return Promise.all(
      playlists.map(async (p) => {
        p.coverImageUrl = await s3Service.generateSignedUrl(p.coverImageUrl);
        return p;
      })
    );
  }

  /**
   * Get all songs and pre-sign their covers and audio URLs.
   */
  async getAllSongs() {
    const songs = await songRepository.findAll();
    return Promise.all(
      songs.map(async (s) => {
        s.coverImageUrl = await s3Service.generateSignedUrl(s.coverImageUrl);
        s.audioUrl = await s3Service.generateSignedUrl(s.audioUrl);
        return s;
      })
    );
  }

  /**
   * Search songs and playlists.
   */
  async search(query) {
    const songs = await songRepository.search(query);
    const playlists = await playlistRepository.findAll(); // Simple filter for playlists in memory or via DB regex
    const playlistRegex = new RegExp(query, 'i');
    const filteredPlaylists = playlists.filter(p => playlistRegex.test(p.title) || playlistRegex.test(p.artistName));

    const signedSongs = await Promise.all(
      songs.map(async (s) => {
        s.coverImageUrl = await s3Service.generateSignedUrl(s.coverImageUrl);
        s.audioUrl = await s3Service.generateSignedUrl(s.audioUrl);
        return s;
      })
    );

    const signedPlaylists = await Promise.all(
      filteredPlaylists.map(async (p) => {
        p.coverImageUrl = await s3Service.generateSignedUrl(p.coverImageUrl);
        return p;
      })
    );

    return { songs: signedSongs, playlists: signedPlaylists };
  }

  /**
   * Get Artist Dashboard details (uploaded songs, playlists, simple analytics).
   */
  async getArtistDashboard(artistId) {
    const songs = await songRepository.findByArtistId(artistId);
    const playlists = await playlistRepository.findByArtistId(artistId);

    // Pre-sign URLs
    const signedSongs = await Promise.all(
      songs.map(async (s) => {
        s.coverImageUrl = await s3Service.generateSignedUrl(s.coverImageUrl);
        s.audioUrl = await s3Service.generateSignedUrl(s.audioUrl);
        return s;
      })
    );

    const signedPlaylists = await Promise.all(
      playlists.map(async (p) => {
        p.coverImageUrl = await s3Service.generateSignedUrl(p.coverImageUrl);
        return p;
      })
    );

    // Calculate analytics
    const totalSongs = songs.length;
    const totalPlaylists = playlists.length;
    const genres = songs.map(s => s.genre);
    const uniqueGenres = [...new Set(genres)];

    const followersCount = await Subscription.countDocuments({ artistId });

    return {
      songs: signedSongs,
      playlists: signedPlaylists,
      analytics: {
        totalSongs,
        totalPlaylists,
        followersCount,
        uniqueGenres,
      },
    };
  }

  /**
   * Delete a song.
   */
  async deleteSong(songId, userId) {
    const song = await songRepository.findById(songId);
    if (!song) {
      throw new Error('Song not found');
    }

    if (song.uploadedBy.toString() !== userId.toString()) {
      throw new Error('Not authorized to delete this song');
    }

    // Delete song from repository
    await songRepository.delete(songId);

    // Remove song from associated playlists
    if (song.playlistId) {
      const playlist = await playlistRepository.findById(song.playlistId);
      if (playlist) {
        playlist.songs = playlist.songs.filter(s => s._id.toString() !== songId.toString());
        await playlist.save();
      }
    }

    return { success: true };
  }

  /**
   * Edit a song.
   */
  async editSong(songId, updateData, userId) {
    const song = await songRepository.findById(songId);
    if (!song) {
      throw new Error('Song not found');
    }

    if (song.uploadedBy.toString() !== userId.toString()) {
      throw new Error('Not authorized to edit this song');
    }

    const updated = await songRepository.update(songId, updateData);
    return updated;
  }

  /**
   * Follow an artist.
   */
  async followArtist(userId, artistId) {
    const artist = await User.findById(artistId);
    if (!artist || artist.role !== 'ARTIST') {
      throw new Error('Artist not found');
    }

    // Create Subscription entry
    return Subscription.findOneAndUpdate(
      { userId, artistId },
      { userId, artistId },
      { upsert: true, new: true }
    );
  }

  /**
   * Unfollow an artist.
   */
  async unfollowArtist(userId, artistId) {
    return Subscription.findOneAndDelete({ userId, artistId });
  }

  /**
   * Check if a user is following an artist.
   */
  async isFollowingArtist(userId, artistId) {
    const sub = await Subscription.findOne({ userId, artistId });
    return !!sub;
  }
}

module.exports = new MusicService();
