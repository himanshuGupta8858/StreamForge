import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAllPlaylistsAPI, getAllSongsAPI } from '../../services/musicAPI';
import { Disc, Play, Star, Sparkles, Radio } from 'lucide-react';

const Home = () => {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (user) {
          const [playlistsRes, songsRes] = await Promise.all([
            getAllPlaylistsAPI(),
            getAllSongsAPI()
          ]);
          setPlaylists(playlistsRes.data.playlists.slice(0, 4));
          setSongs(songsRes.data.songs.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  return (
    <div className="bg-spotify-dark min-h-[90vh] pb-12">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-spotify-green/20 via-spotify-dark to-spotify-dark py-20 px-6 text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
          <div className="inline-flex items-center gap-2 bg-spotify-light/65 px-4 py-1.5 rounded-full border border-spotify-light/35 text-spotify-green text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Stream & Upload Music
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Your Sound. Your Platform.<br />
            <span className="text-spotify-green">Unchained.</span>
          </h1>
          <p className="text-spotify-gray text-base md:text-lg max-w-2xl">
            A production-grade, microservice-powered Spotify streaming environment. Creators publish directly to AWS S3, while listeners enjoy instant streaming.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {user ? (
              <Link
                to={user.role === 'ARTIST' ? '/artist/dashboard' : '/user/dashboard'}
                className="bg-spotify-green hover:bg-spotify-green/90 hover:scale-105 text-black font-bold px-8 py-3.5 rounded-full transition-all text-sm shadow-lg shadow-spotify-green/10"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="bg-spotify-green hover:bg-spotify-green/90 hover:scale-105 text-black font-bold px-8 py-3.5 rounded-full transition-all text-sm shadow-lg shadow-spotify-green/10"
                >
                  Join the Platform
                </Link>
                <Link
                  to="/login"
                  className="bg-transparent hover:bg-spotify-light/20 border border-spotify-light/50 text-white font-bold px-8 py-3.5 rounded-full transition-all text-sm"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content (Only displays collections if logged in, otherwise prompts login) */}
      <div className="max-w-7xl mx-auto px-6 mt-12">
        {!user ? (
          <div className="bg-spotify-card border border-spotify-light/20 rounded-2xl p-12 text-center max-w-2xl mx-auto flex flex-col items-center gap-4">
            <Radio className="w-16 h-16 text-spotify-green animate-pulse" />
            <h2 className="text-2xl font-bold text-white">Unlock full streaming access</h2>
            <p className="text-spotify-gray text-sm">
              Log in or register to explore trending playlists, listen to high-fidelity audio, subscribe to your favorite artists, or upload your own creations.
            </p>
            <Link
              to="/login"
              className="bg-white hover:scale-105 text-black font-bold px-8 py-3 rounded-full transition-all text-sm mt-2"
            >
              Get Started
            </Link>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-spotify-green border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Trending Playlists */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Star className="w-6 h-6 text-spotify-green fill-spotify-green" />
                  Trending Playlists
                </h2>
                <Link to="/user/dashboard" className="text-xs font-bold text-spotify-gray hover:text-white uppercase tracking-wider">
                  See All
                </Link>
              </div>

              {playlists.length === 0 ? (
                <div className="bg-spotify-card border border-spotify-light/10 p-6 rounded-xl text-center text-spotify-gray text-sm">
                  No playlists created yet. Create a playlist from the Artist dashboard!
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {playlists.map((playlist) => (
                    <Link
                      key={playlist._id}
                      to={`/playlist/${playlist._id}`}
                      className="bg-spotify-card hover:bg-spotify-hover p-4 rounded-xl transition-all group border border-transparent hover:border-spotify-light/10 block"
                    >
                      <div className="relative aspect-square mb-4 rounded-md overflow-hidden bg-spotify-light/30">
                        <img
                          src={playlist.coverImageUrl}
                          alt={playlist.title}
                          className="object-cover w-full h-full"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                          <button className="bg-spotify-green p-3 rounded-full text-black hover:scale-115 transition-all shadow-lg">
                            <Play className="w-5 h-5 fill-black" />
                          </button>
                        </div>
                      </div>
                      <h3 className="font-bold text-white truncate text-sm mb-1">{playlist.title}</h3>
                      <p className="text-spotify-gray text-xs truncate">By {playlist.artistName}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Latest Songs */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Disc className="w-6 h-6 text-spotify-green" />
                  Latest Releases
                </h2>
                <Link to="/user/dashboard" className="text-xs font-bold text-spotify-gray hover:text-white uppercase tracking-wider">
                  See All
                </Link>
              </div>

              {songs.length === 0 ? (
                <div className="bg-spotify-card border border-spotify-light/10 p-6 rounded-xl text-center text-spotify-gray text-sm">
                  No songs uploaded yet. Be the first to upload music!
                </div>
              ) : (
                <div className="bg-spotify-card border border-spotify-light/10 rounded-xl overflow-hidden divide-y divide-spotify-light/15">
                  {songs.map((song, index) => (
                    <Link
                      key={song._id}
                      to={`/music/${song._id}`}
                      className="flex items-center justify-between p-4 hover:bg-spotify-hover/60 transition-all group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="text-spotify-gray font-semibold text-sm w-4 text-center">
                          {index + 1}
                        </span>
                        <div className="w-10 h-10 bg-spotify-light/30 rounded-md overflow-hidden flex-shrink-0">
                          <img src={song.coverImageUrl} alt={song.title} className="object-cover w-full h-full" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-white text-sm truncate group-hover:text-spotify-green transition-all">
                            {song.title}
                          </h4>
                          <p className="text-spotify-gray text-xs truncate">{song.artistName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <span className="text-xs text-spotify-gray hidden sm:inline-block px-3 py-1 rounded-full bg-spotify-light/30 border border-spotify-light/10 uppercase font-bold tracking-wider">
                          {song.genre}
                        </span>
                        <span className="text-sm text-spotify-gray">
                          {Math.floor(song.duration / 60)}:
                          {String(Math.floor(song.duration % 60)).padStart(2, '0')}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
