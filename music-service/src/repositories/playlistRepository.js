const Playlist = require('../models/Playlist');

class PlaylistRepository {
  async create(playlistData) {
    return Playlist.create(playlistData);
  }

  async findById(id) {
    return Playlist.findById(id).populate('songs');
  }

  async findByArtistId(artistId) {
    return Playlist.find({ artistId }).populate('songs');
  }

  async findAll() {
    return Playlist.find().populate('songs');
  }

  async addSongToPlaylist(playlistId, songId) {
    return Playlist.findByIdAndUpdate(
      playlistId,
      { $addToSet: { songs: songId } },
      { new: true }
    );
  }

  async delete(id) {
    return Playlist.findByIdAndDelete(id);
  }

  async update(id, updateData) {
    return Playlist.findByIdAndUpdate(id, updateData, { new: true });
  }
}

module.exports = new PlaylistRepository();
