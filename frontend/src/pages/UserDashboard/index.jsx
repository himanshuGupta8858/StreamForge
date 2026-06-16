import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllPlaylistsAPI, getAllSongsAPI, searchAPI, followArtistAPI, unfollowArtistAPI, isFollowingArtistAPI } from '../../services/musicAPI';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Disc, Play, Search, PlusCircle, CheckCircle, Home, UserCheck, UserPlus, Music, Heart } from 'lucide-react';

const UserDashboard = () => {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [songs, setSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Track follow status of artists locally
  const [followingStates, setFollowingStates] = useState({});

  const loadData = async () => {
    try {
      const [playlistsRes, songsRes] = await Promise.all([
        getAllPlaylistsAPI(),
        getAllSongsAPI()
      ]);
      setPlaylists(playlistsRes.data.playlists);
      setSongs(songsRes.data.songs);
      
      // Load following states for all artists loaded
      const allArtists = [
        ...playlistsRes.data.playlists.map(p => p.artistId),
        ...songsRes.data.songs.map(s => s.uploadedBy)
      ].filter((val, id, self) => self.indexOf(val) === id && val);

      const states = {};
      await Promise.all(
        allArtists.map(async (artistId) => {
          try {
            const check = await isFollowingArtistAPI(artistId);
            states[artistId] = check.data.isFollowing;
          } catch {
            states[artistId] = false;
          }
        })
      );
      setFollowingStates(states);
    } catch (err) {
      console.error('Failed to load user dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      const res = await searchAPI(query);
      if (res.data.success) {
        setSearchResults(res.data.results);
      }
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const handleFollowToggle = async (artistId, artistName) => {
    const isCurrentlyFollowing = followingStates[artistId];
    try {
      if (isCurrentlyFollowing) {
        await unfollowArtistAPI(artistId);
        setFollowingStates(prev => ({ ...prev, [artistId]: false }));
        toast.success(`Unfollowed ${artistName}`);
      } else {
        await followArtistAPI(artistId);
        setFollowingStates(prev => ({ ...prev, [artistId]: true }));
        toast.success(`Following ${artistName}!`);
      }
    } catch (err) {
      toast.error('Failed to update follow status');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-spotify-dark">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-spotify-green border-t-transparent"></div>
      </div>
    );
  }

  const displayedPlaylists = searchResults ? searchResults.playlists : playlists;
  const displayedSongs = searchResults ? searchResults.songs : songs;

  return (
    <div className="bg-spotify-dark min-h-[90vh] flex">
      {/* Sidebar (Spotify-style) */}
      <aside className="w-64 bg-black p-6 hidden md:flex flex-col gap-6 border-r border-spotify-light/20">
        <div className="flex flex-col gap-4">
          <Link to="/" className="flex items-center gap-3 text-spotify-gray hover:text-white font-bold text-sm transition-all">
            <Home className="w-5 h-5 text-spotify-green" />
            Home
          </Link>
          <button onClick={() => setSearchQuery('')} className="flex items-center gap-3 text-white font-bold text-sm transition-all text-left">
            <Search className="w-5 h-5 text-spotify-green" />
            Search & Browse
          </button>
        </div>

        <div className="flex-1 border-t border-spotify-light/10 pt-4">
          <span className="text-xs uppercase font-extrabold tracking-wider text-spotify-gray mb-3 block">Your Playlists</span>
          {playlists.length === 0 ? (
            <p className="text-xs text-spotify-gray italic">No playlists available.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {playlists.map(p => (
                <Link key={p._id} to={`/playlist/${p._id}`} className="text-xs font-semibold text-spotify-gray hover:text-white truncate">
                  {p.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl">
        {/* Search Header */}
        <div className="relative w-full max-w-md mb-8">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-spotify-gray" />
          <input
            type="text"
            placeholder="Search songs, playlists, or artists..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full bg-spotify-light/45 border border-spotify-light/35 focus:border-spotify-green rounded-full pl-10 pr-4 py-2.5 text-white placeholder-spotify-gray focus:outline-none transition-all text-sm"
          />
        </div>

        {/* Content Section */}
        <div className="space-y-10">
          {searchQuery && searchResults && (
            <div className="bg-spotify-green/10 border border-spotify-green/20 p-3 rounded-lg text-spotify-green text-xs font-bold flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4" />
              Showing search results for "{searchQuery}"
            </div>
          )}

          {/* Browse Playlists */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Playlists</h3>
            {displayedPlaylists.length === 0 ? (
              <div className="bg-spotify-card border border-spotify-light/10 p-6 rounded-xl text-center text-spotify-gray text-sm">
                No playlists found.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayedPlaylists.map((playlist) => (
                  <div
                    key={playlist._id}
                    className="bg-spotify-card hover:bg-spotify-hover p-4 rounded-xl transition-all group border border-transparent hover:border-spotify-light/10 relative"
                  >
                    <Link to={`/playlist/${playlist._id}`} className="block">
                      <div className="relative aspect-square mb-4 rounded-md overflow-hidden bg-spotify-light/30">
                        <img src={playlist.coverImageUrl} alt={playlist.title} className="object-cover w-full h-full" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                          <button className="bg-spotify-green p-3 rounded-full text-black hover:scale-115 transition-all shadow-lg">
                            <Play className="w-5 h-5 fill-black" />
                          </button>
                        </div>
                      </div>
                      <h4 className="font-bold text-white truncate text-sm mb-1">{playlist.title}</h4>
                      <p className="text-spotify-gray text-xs truncate">By {playlist.artistName}</p>
                    </Link>

                    {/* Follow Artist Action */}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[10px] text-spotify-gray font-bold">Follow Artist:</span>
                      <button
                        onClick={() => handleFollowToggle(playlist.artistId, playlist.artistName)}
                        className="text-xs bg-transparent hover:text-white transition-all text-spotify-green flex items-center gap-1 font-semibold"
                      >
                        {followingStates[playlist.artistId] ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5 text-spotify-green" />
                            Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5 text-spotify-gray" />
                            Follow
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Browse Songs */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Songs</h3>
            {displayedSongs.length === 0 ? (
              <div className="bg-spotify-card border border-spotify-light/10 p-6 rounded-xl text-center text-spotify-gray text-sm">
                No songs found.
              </div>
            ) : (
              <div className="bg-spotify-card border border-spotify-light/10 rounded-xl overflow-hidden divide-y divide-spotify-light/15">
                {displayedSongs.map((song, index) => (
                  <div
                    key={song._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-spotify-hover/40 transition-all gap-4"
                  >
                    <Link to={`/music/${song._id}`} className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-spotify-gray font-semibold text-sm w-4 text-center hidden sm:inline-block">
                        {index + 1}
                      </span>
                      <div className="w-10 h-10 bg-spotify-light/30 rounded-md overflow-hidden flex-shrink-0">
                        <img src={song.coverImageUrl} alt={song.title} className="object-cover w-full h-full" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-white text-sm truncate hover:text-spotify-green transition-all">{song.title}</h4>
                        <p className="text-spotify-gray text-xs truncate">By {song.artistName} • {song.genre}</p>
                      </div>
                    </Link>

                    {/* Meta and Follow Options */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-spotify-light/10 sm:border-0 pt-2 sm:pt-0">
                      <button
                        onClick={() => handleFollowToggle(song.uploadedBy, song.artistName)}
                        className="text-xs bg-spotify-light/40 hover:bg-spotify-light border border-spotify-light/30 text-white font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5"
                      >
                        {followingStates[song.uploadedBy] ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5 text-spotify-green" />
                            Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            Follow Artist
                          </>
                        )}
                      </button>
                      <span className="text-sm text-spotify-gray hidden sm:inline-block">
                        {Math.floor(song.duration / 60)}:
                        {String(Math.floor(song.duration % 60)).padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
