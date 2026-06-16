import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPlaylistAPI } from '../../services/musicAPI';
import { Disc, Play, Clock, ArrowLeft, Headphones } from 'lucide-react';

const PlaylistDetail = () => {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const res = await getPlaylistAPI(id);
        if (res.data.success) {
          setPlaylist(res.data.playlist);
        }
      } catch (err) {
        console.error('Failed to load playlist:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylist();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-spotify-dark">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-spotify-green border-t-transparent"></div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-spotify-dark p-6 text-center">
        <Disc className="w-16 h-16 text-spotify-gray mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Playlist not found</h2>
        <Link to="/user/dashboard" className="text-spotify-green hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-spotify-dark min-h-[90vh] pb-12">
      {/* Header info */}
      <div className="bg-gradient-to-b from-spotify-light/40 to-spotify-dark p-6 md:p-12">
        <div className="max-w-7xl mx-auto">
          {/* Back button */}
          <Link to="/user/dashboard" className="inline-flex items-center gap-1 text-spotify-gray hover:text-white mb-6 text-sm font-semibold transition-all">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            {/* Cover image */}
            <div className="w-48 h-48 md:w-60 md:h-60 bg-spotify-light/30 rounded-xl overflow-hidden shadow-2xl flex-shrink-0 border border-spotify-light/20">
              <img src={playlist.coverImageUrl} alt={playlist.title} className="object-cover w-full h-full" />
            </div>

            {/* Meta */}
            <div className="text-center md:text-left">
              <span className="text-xs uppercase font-extrabold tracking-wider text-spotify-green mb-1 block">
                Playlist
              </span>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3">
                {playlist.title}
              </h1>
              <p className="text-spotify-gray text-sm md:text-base mb-4 max-w-xl">
                {playlist.description}
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs font-semibold text-spotify-gray">
                <span className="text-white">{playlist.artistName}</span>
                <span>•</span>
                <span>{playlist.songs ? playlist.songs.length : 0} songs</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Songs List */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 mt-8">
        {(!playlist.songs || playlist.songs.length === 0) ? (
          <div className="bg-spotify-card border border-spotify-light/10 p-12 rounded-xl text-center text-spotify-gray text-sm">
            This playlist doesn't have any songs yet.
          </div>
        ) : (
          <div className="bg-spotify-card border border-spotify-light/10 rounded-xl overflow-hidden">
            {/* Headers */}
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-6 py-3 border-b border-spotify-light/15 text-xs font-bold uppercase tracking-wider text-spotify-gray">
              <span className="w-4 text-center">#</span>
              <span>Title</span>
              <span className="mr-2"><Clock className="w-4 h-4" /></span>
            </div>

            {/* Songs */}
            <div className="divide-y divide-spotify-light/15">
              {playlist.songs.map((song, index) => (
                <Link
                  key={song._id}
                  to={`/music/${song._id}`}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-6 py-4 hover:bg-spotify-hover/60 transition-all group"
                >
                  <span className="text-spotify-gray font-semibold text-sm w-4 text-center group-hover:hidden">
                    {index + 1}
                  </span>
                  <span className="hidden group-hover:inline-block w-4 text-center text-spotify-green">
                    <Headphones className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-white text-sm truncate group-hover:text-spotify-green transition-all">
                      {song.title}
                    </h4>
                    <p className="text-spotify-gray text-xs truncate">By {song.artistName}</p>
                  </div>
                  <span className="text-sm text-spotify-gray pr-2">
                    {Math.floor(song.duration / 60)}:
                    {String(Math.floor(song.duration % 60)).padStart(2, '0')}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistDetail;
