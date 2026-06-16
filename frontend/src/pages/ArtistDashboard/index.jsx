import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getArtistDashboardAPI, createPlaylistAPI, uploadSongAPI, deleteSongAPI, editSongAPI } from '../../services/musicAPI';
import { toast } from 'react-hot-toast';
import { Disc, Play, Star, Plus, Upload, Music, Users, BarChart2, Edit2, Trash2 } from 'lucide-react';

// Zod schemas for validation
const playlistSchema = z.object({
  title: z.string().min(1, { message: 'Playlist title is required' }),
  description: z.string().min(1, { message: 'Playlist description is required' }),
});

const songSchema = z.object({
  title: z.string().min(1, { message: 'Song title is required' }),
  duration: z.string().min(1, { message: 'Duration (in seconds) is required' }),
  genre: z.string().min(1, { message: 'Genre is required' }),
  playlistId: z.string().optional(),
});

const ArtistDashboard = () => {
  const [data, setData] = useState({ songs: [], playlists: [], analytics: { totalSongs: 0, totalPlaylists: 0, followersCount: 0, uniqueGenres: [] } });
  const [loading, setLoading] = useState(true);
  const [showPlaylistForm, setShowPlaylistForm] = useState(false);
  const [showSongForm, setShowSongForm] = useState(false);

  // File states
  const [playlistCover, setPlaylistCover] = useState(null);
  const [songCover, setSongCover] = useState(null);
  const [songAudio, setSongAudio] = useState(null);

  // Editing state
  const [editingSongId, setEditingSongId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editGenre, setEditGenre] = useState('');

  const loadDashboard = async () => {
    try {
      const res = await getArtistDashboardAPI();
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load artist dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Form 1: Playlist
  const {
    register: registerPlaylist,
    handleSubmit: handleSubmitPlaylist,
    reset: resetPlaylist,
    formState: { errors: errorsPlaylist, isSubmitting: isSubmittingPlaylist },
  } = useForm({
    resolver: zodResolver(playlistSchema),
  });

  // Form 2: Song
  const {
    register: registerSong,
    handleSubmit: handleSubmitSong,
    reset: resetSong,
    formState: { errors: errorsSong, isSubmitting: isSubmittingSong },
  } = useForm({
    resolver: zodResolver(songSchema),
  });

  const onCreatePlaylist = async (formData) => {
    if (!playlistCover) {
      return toast.error('Please upload a cover image file');
    }

    try {
      const dataToSend = new FormData();
      dataToSend.append('title', formData.title);
      dataToSend.append('description', formData.description);
      dataToSend.append('coverImage', playlistCover);

      const res = await createPlaylistAPI(dataToSend);
      if (res.data.success) {
        toast.success('Playlist created successfully!');
        resetPlaylist();
        setPlaylistCover(null);
        setShowPlaylistForm(false);
        loadDashboard();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create playlist');
    }
  };

  const onUploadSong = async (formData) => {
    if (!songCover || !songAudio) {
      return toast.error('Both cover image and audio files are required');
    }

    try {
      const dataToSend = new FormData();
      dataToSend.append('title', formData.title);
      dataToSend.append('duration', formData.duration);
      dataToSend.append('genre', formData.genre);
      if (formData.playlistId) {
        dataToSend.append('playlistId', formData.playlistId);
      }
      dataToSend.append('coverImageFile', songCover);
      dataToSend.append('audioFile', songAudio);

      const res = await uploadSongAPI(dataToSend);
      if (res.data.success) {
        toast.success('Song uploaded successfully!');
        resetSong();
        setSongCover(null);
        setSongAudio(null);
        setShowSongForm(false);
        loadDashboard();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload song');
    }
  };

  const onDeleteSong = async (songId) => {
    if (!window.confirm('Are you sure you want to delete this song?')) return;
    try {
      const res = await deleteSongAPI(songId);
      if (res.data.success) {
        toast.success('Song deleted successfully');
        loadDashboard();
      }
    } catch (err) {
      toast.error('Failed to delete song');
    }
  };

  const handleEditClick = (song) => {
    setEditingSongId(song._id);
    setEditTitle(song.title);
    setEditGenre(song.genre);
  };

  const handleSaveEdit = async (songId) => {
    try {
      const res = await editSongAPI(songId, { title: editTitle, genre: editGenre });
      if (res.data.success) {
        toast.success('Song updated successfully');
        setEditingSongId(null);
        loadDashboard();
      }
    } catch (err) {
      toast.error('Failed to edit song');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-spotify-dark">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-spotify-green border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="bg-spotify-dark min-h-[90vh] py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Artist Dashboard</h1>
            <p className="text-spotify-gray text-sm">Manage your releases, playlists, and view music analytics.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowPlaylistForm(!showPlaylistForm)}
              className="bg-transparent hover:bg-spotify-light/20 text-white font-bold border border-spotify-light/50 px-5 py-2.5 rounded-full transition-all text-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-spotify-green" />
              Create Playlist
            </button>
            <button
              onClick={() => setShowSongForm(!showSongForm)}
              className="bg-spotify-green hover:bg-spotify-green/90 text-black font-bold px-5 py-2.5 rounded-full transition-all text-xs flex items-center gap-1.5 shadow-lg shadow-spotify-green/10"
            >
              <Upload className="w-4 h-4" />
              Upload Song
            </button>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-spotify-card border border-spotify-light/10 p-5 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-spotify-light/50 rounded-lg text-spotify-green">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-spotify-gray font-bold uppercase tracking-wider block">Songs</span>
              <span className="text-2xl font-black text-white">{data.analytics.totalSongs}</span>
            </div>
          </div>
          <div className="bg-spotify-card border border-spotify-light/10 p-5 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-spotify-light/50 rounded-lg text-spotify-green">
              <Disc className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-spotify-gray font-bold uppercase tracking-wider block">Playlists</span>
              <span className="text-2xl font-black text-white">{data.analytics.totalPlaylists}</span>
            </div>
          </div>
          <div className="bg-spotify-card border border-spotify-light/10 p-5 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-spotify-light/50 rounded-lg text-spotify-green">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-spotify-gray font-bold uppercase tracking-wider block">Followers</span>
              <span className="text-2xl font-black text-white">{data.analytics.followersCount}</span>
            </div>
          </div>
          <div className="bg-spotify-card border border-spotify-light/10 p-5 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-spotify-light/50 rounded-lg text-spotify-green">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-spotify-gray font-bold uppercase tracking-wider block">Genres</span>
              <span className="text-sm font-black text-white truncate max-w-[120px] block">
                {data.analytics.uniqueGenres.join(', ') || 'None'}
              </span>
            </div>
          </div>
        </div>

        {/* Playlist Form Modal / Section */}
        {showPlaylistForm && (
          <div className="bg-spotify-card border border-spotify-light/20 p-6 rounded-xl mb-8 max-w-xl">
            <h3 className="text-lg font-bold text-white mb-4">Create New Playlist</h3>
            <form onSubmit={handleSubmitPlaylist(onCreatePlaylist)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-spotify-gray mb-1">Playlist Title</label>
                <input
                  type="text"
                  {...registerPlaylist('title')}
                  placeholder="My Playlist"
                  className="w-full bg-spotify-light/50 border border-spotify-light/40 focus:border-spotify-green rounded-lg px-4 py-2 text-white placeholder-spotify-gray focus:outline-none transition-all text-sm"
                />
                {errorsPlaylist.title && <p className="text-red-500 text-xs mt-1">{errorsPlaylist.title.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-spotify-gray mb-1">Description</label>
                <textarea
                  rows="3"
                  {...registerPlaylist('description')}
                  placeholder="Give your playlist a description"
                  className="w-full bg-spotify-light/50 border border-spotify-light/40 focus:border-spotify-green rounded-lg px-4 py-2 text-white placeholder-spotify-gray focus:outline-none transition-all text-sm"
                />
                {errorsPlaylist.description && <p className="text-red-500 text-xs mt-1">{errorsPlaylist.description.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-spotify-gray mb-1">Cover Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPlaylistCover(e.target.files[0])}
                  className="w-full text-xs text-spotify-gray file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-spotify-light file:text-white hover:file:bg-spotify-light/80 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPlaylistForm(false)}
                  className="bg-transparent hover:bg-spotify-light/20 border border-spotify-light/50 text-white font-bold px-4 py-2 rounded-full transition-all text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPlaylist}
                  className="bg-spotify-green hover:bg-spotify-green/90 text-black font-bold px-6 py-2 rounded-full transition-all text-xs disabled:opacity-50"
                >
                  {isSubmittingPlaylist ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Song Form Modal / Section */}
        {showSongForm && (
          <div className="bg-spotify-card border border-spotify-light/20 p-6 rounded-xl mb-8 max-w-xl">
            <h3 className="text-lg font-bold text-white mb-4">Upload New Song</h3>
            <form onSubmit={handleSubmitSong(onUploadSong)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-spotify-gray mb-1">Song Title</label>
                  <input
                    type="text"
                    {...registerSong('title')}
                    placeholder="Song Name"
                    className="w-full bg-spotify-light/50 border border-spotify-light/40 focus:border-spotify-green rounded-lg px-4 py-2.5 text-white placeholder-spotify-gray focus:outline-none transition-all text-sm"
                  />
                  {errorsSong.title && <p className="text-red-500 text-xs mt-1">{errorsSong.title.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-spotify-gray mb-1">Duration (Seconds)</label>
                  <input
                    type="number"
                    {...registerSong('duration')}
                    placeholder="e.g. 180"
                    className="w-full bg-spotify-light/50 border border-spotify-light/40 focus:border-spotify-green rounded-lg px-4 py-2.5 text-white placeholder-spotify-gray focus:outline-none transition-all text-sm"
                  />
                  {errorsSong.duration && <p className="text-red-500 text-xs mt-1">{errorsSong.duration.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-spotify-gray mb-1">Genre</label>
                  <input
                    type="text"
                    {...registerSong('genre')}
                    placeholder="Pop, Rock, Hip-Hop"
                    className="w-full bg-spotify-light/50 border border-spotify-light/40 focus:border-spotify-green rounded-lg px-4 py-2.5 text-white placeholder-spotify-gray focus:outline-none transition-all text-sm"
                  />
                  {errorsSong.genre && <p className="text-red-500 text-xs mt-1">{errorsSong.genre.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-spotify-gray mb-1">Add to Playlist (Optional)</label>
                  <select
                    {...registerSong('playlistId')}
                    className="w-full bg-spotify-light/50 border border-spotify-light/40 focus:border-spotify-green rounded-lg px-4 py-2.5 text-white focus:outline-none transition-all text-sm cursor-pointer"
                  >
                    <option value="" className="bg-spotify-card text-white">None (Single)</option>
                    {data.playlists.map(p => (
                      <option key={p._id} value={p._id} className="bg-spotify-card text-white">{p.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-spotify-gray mb-1">Cover Image file</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSongCover(e.target.files[0])}
                    className="w-full text-xs text-spotify-gray file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-spotify-light file:text-white cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-spotify-gray mb-1">Audio file</label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setSongAudio(e.target.files[0])}
                    className="w-full text-xs text-spotify-gray file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-spotify-light file:text-white cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-spotify-light/10">
                <button
                  type="button"
                  onClick={() => setShowSongForm(false)}
                  className="bg-transparent hover:bg-spotify-light/20 border border-spotify-light/50 text-white font-bold px-4 py-2 rounded-full transition-all text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSong}
                  className="bg-spotify-green hover:bg-spotify-green/90 text-black font-bold px-6 py-2 rounded-full transition-all text-xs disabled:opacity-50"
                >
                  {isSubmittingSong ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Playlists and Songs Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Playlists List */}
          <div className="lg:col-span-1">
            <h3 className="text-xl font-bold text-white mb-4">My Playlists</h3>
            {data.playlists.length === 0 ? (
              <div className="bg-spotify-card border border-spotify-light/10 p-6 rounded-xl text-center text-spotify-gray text-sm">
                No playlists created yet.
              </div>
            ) : (
              <div className="space-y-3">
                {data.playlists.map((playlist) => (
                  <div key={playlist._id} className="bg-spotify-card border border-spotify-light/10 p-3 rounded-xl flex items-center gap-3">
                    <div className="w-12 h-12 bg-spotify-light/35 rounded-md overflow-hidden flex-shrink-0">
                      <img src={playlist.coverImageUrl} alt={playlist.title} className="object-cover w-full h-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-white text-sm truncate">{playlist.title}</h4>
                      <p className="text-spotify-gray text-xs truncate">{playlist.songs.length} songs</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Songs List */}
          <div className="lg:col-span-2">
            <h3 className="text-xl font-bold text-white mb-4">Uploaded Songs</h3>
            {data.songs.length === 0 ? (
              <div className="bg-spotify-card border border-spotify-light/10 p-12 rounded-xl text-center text-spotify-gray text-sm">
                No music uploaded yet. Upload your first track!
              </div>
            ) : (
              <div className="bg-spotify-card border border-spotify-light/10 rounded-xl overflow-hidden divide-y divide-spotify-light/15">
                {data.songs.map((song) => (
                  <div key={song._id} className="flex items-center justify-between p-4 hover:bg-spotify-hover/40 transition-all">
                    {editingSongId === song._id ? (
                      <div className="flex flex-1 items-center gap-3">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="bg-spotify-light border border-spotify-green text-white text-sm rounded-lg px-3 py-1 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={editGenre}
                          onChange={(e) => setEditGenre(e.target.value)}
                          className="bg-spotify-light border border-spotify-green text-white text-sm rounded-lg px-3 py-1 focus:outline-none"
                        />
                        <button
                          onClick={() => handleSaveEdit(song._id)}
                          className="bg-spotify-green text-black font-bold px-3 py-1 rounded-full text-xs"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingSongId(null)}
                          className="text-spotify-gray hover:text-white text-xs font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 bg-spotify-light/30 rounded-md overflow-hidden flex-shrink-0">
                            <img src={song.coverImageUrl} alt={song.title} className="object-cover w-full h-full" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-white text-sm truncate">{song.title}</h4>
                            <p className="text-spotify-gray text-xs uppercase tracking-wide font-bold">{song.genre}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-sm text-spotify-gray mr-4">
                            {Math.floor(song.duration / 60)}:
                            {String(Math.floor(song.duration % 60)).padStart(2, '0')}
                          </span>
                          <button
                            onClick={() => handleEditClick(song)}
                            className="text-spotify-gray hover:text-white p-1.5 hover:bg-spotify-light/35 rounded-full transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteSong(song._id)}
                            className="text-spotify-gray hover:text-red-500 p-1.5 hover:bg-spotify-light/35 rounded-full transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistDashboard;
