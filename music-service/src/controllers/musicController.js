const musicService = require('../services/musicService');

/**
 * Controller layer for music and playlist endpoints.
 */
class MusicController {
  async createPlaylist(req, res) {
    try {
      const { title, description } = req.body;
      const coverImageFile = req.file;

      if (!title || !description) {
        return res.status(400).json({ success: false, message: 'Title and description are required' });
      }

      const playlist = await musicService.createPlaylist(
        title,
        description,
        coverImageFile,
        req.user._id,
        req.user.name
      );

      res.status(201).json({
        success: true,
        message: 'Playlist created successfully',
        playlist,
      });
    } catch (error) {
      console.error('❌ Create playlist error:', error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async uploadSong(req, res) {
    try {
      const { title, duration, genre, playlistId } = req.body;
      const audioFile = req.files && req.files.audioFile ? req.files.audioFile[0] : null;
      const coverImageFile = req.files && req.files.coverImageFile ? req.files.coverImageFile[0] : null;

      if (!title || !duration || !genre) {
        return res.status(400).json({ success: false, message: 'Title, duration, and genre are required' });
      }

      const song = await musicService.uploadSong(
        { title, duration, genre, playlistId },
        audioFile,
        coverImageFile,
        req.user._id,
        req.user.name
      );

      res.status(201).json({
        success: true,
        message: 'Music uploaded successfully',
        song,
      });
    } catch (error) {
      console.error('❌ Music upload error:', error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getPlaylist(req, res) {
    try {
      const playlist = await musicService.getPlaylistDetails(req.params.id);
      if (!playlist) {
        return res.status(404).json({ success: false, message: 'Playlist not found' });
      }
      res.status(200).json({ success: true, playlist });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getSong(req, res) {
    try {
      const song = await musicService.getSongDetails(req.params.id);
      if (!song) {
        return res.status(404).json({ success: false, message: 'Song not found' });
      }
      res.status(200).json({ success: true, song });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAllPlaylists(req, res) {
    try {
      const playlists = await musicService.getAllPlaylists();
      res.status(200).json({ success: true, playlists });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAllSongs(req, res) {
    try {
      const songs = await musicService.getAllSongs();
      res.status(200).json({ success: true, songs });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getArtistDashboard(req, res) {
    try {
      const data = await musicService.getArtistDashboard(req.user._id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async search(req, res) {
    try {
      const results = await musicService.search(req.query.q || '');
      res.status(200).json({ success: true, results });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async editSong(req, res) {
    try {
      const song = await musicService.editSong(req.params.id, req.body, req.user._id);
      res.status(200).json({ success: true, message: 'Song updated successfully', song });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async deleteSong(req, res) {
    try {
      await musicService.deleteSong(req.params.id, req.user._id);
      res.status(200).json({ success: true, message: 'Song deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async followArtist(req, res) {
    try {
      await musicService.followArtist(req.user._id, req.params.id);
      res.status(200).json({ success: true, message: 'Subscribed to artist successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async unfollowArtist(req, res) {
    try {
      await musicService.unfollowArtist(req.user._id, req.params.id);
      res.status(200).json({ success: true, message: 'Unsubscribed from artist successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async checkFollowing(req, res) {
    try {
      const isFollowing = await musicService.isFollowingArtist(req.user._id, req.params.id);
      res.status(200).json({ success: true, isFollowing });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new MusicController();
