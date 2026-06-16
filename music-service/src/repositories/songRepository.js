const Song = require('../models/Song');

class SongRepository {
  async create(songData) {
    return Song.create(songData);
  }

  async findById(id) {
    return Song.findById(id);
  }

  async findByArtistId(artistId) {
    return Song.find({ uploadedBy: artistId });
  }

  async findByPlaylistId(playlistId) {
    return Song.find({ playlistId });
  }

  async findAll() {
    return Song.find();
  }

  async search(query) {
    const searchRegex = new RegExp(query, 'i');
    return Song.find({
      $or: [
        { title: searchRegex },
        { artistName: searchRegex },
        { genre: searchRegex }
      ]
    });
  }

  async delete(id) {
    return Song.findByIdAndDelete(id);
  }

  async update(id, updateData) {
    return Song.findByIdAndUpdate(id, updateData, { new: true });
  }
}

module.exports = new SongRepository();
