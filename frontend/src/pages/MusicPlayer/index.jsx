import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSongAPI } from '../../services/musicAPI';
import { Play, Pause, Volume2, VolumeX, ArrowLeft, Disc, Clock, Settings, Gauge } from 'lucide-react';

const MusicPlayerDetail = () => {
  const { id } = useParams();
  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  
  const audioRef = useRef(null);

  useEffect(() => {
    const fetchSong = async () => {
      try {
        const res = await getSongAPI(id);
        if (res.data.success) {
          setSong(res.data.song);
        }
      } catch (err) {
        console.error('Failed to load song details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSong();
  }, [id]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed, song]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => console.error('Audio play failed:', err));
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleProgressChange = (e) => {
    const newTime = Number(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      audioRef.current.muted = newVolume === 0;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioRef.current.muted = nextMuted;
  };

  const handleSpeedChange = (e) => {
    setSpeed(Number(e.target.value));
  };

  const formatTime = (timeInSecs) => {
    if (isNaN(timeInSecs)) return '0:00';
    const mins = Math.floor(timeInSecs / 60);
    const secs = Math.floor(timeInSecs % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-spotify-dark">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-spotify-green border-t-transparent"></div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-spotify-dark p-6 text-center">
        <Disc className="w-16 h-16 text-spotify-gray mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Song not found</h2>
        <Link to="/user/dashboard" className="text-spotify-green hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-spotify-dark min-h-[90vh] pb-12 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-lg bg-spotify-card border border-spotify-light/20 p-8 rounded-2xl shadow-2xl flex flex-col items-center">
        {/* Back Link */}
        <div className="w-full flex justify-start mb-6">
          <Link to="/user/dashboard" className="inline-flex items-center gap-1.5 text-spotify-gray hover:text-white text-xs font-bold uppercase tracking-wider transition-all">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* Cover image */}
        <div className="w-64 h-64 md:w-80 md:h-80 bg-spotify-light/30 rounded-xl overflow-hidden shadow-2xl mb-8 relative group border border-spotify-light/25">
          <img src={song.coverImageUrl} alt={song.title} className="object-cover w-full h-full" />
          <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
            <Disc className={`w-16 h-16 text-spotify-green ${isPlaying ? 'animate-spin' : ''}`} />
          </div>
        </div>

        {/* Song Info */}
        <div className="text-center mb-6 w-full">
          <h2 className="text-2xl font-black text-white tracking-tight truncate px-4">
            {song.title}
          </h2>
          <p className="text-spotify-green font-semibold text-sm mt-1 truncate">
            {song.artistName}
          </p>
          <span className="inline-block bg-spotify-light text-spotify-gray text-xs px-3 py-1 rounded-full uppercase font-bold tracking-wider mt-3">
            {song.genre}
          </span>
        </div>

        {/* Audio Element */}
        <audio
          ref={audioRef}
          src={song.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />

        {/* Progress Timeline */}
        <div className="w-full mb-6">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleProgressChange}
            className="w-full h-1 bg-spotify-light/60 rounded-lg appearance-none cursor-pointer accent-spotify-green mb-2"
          />
          <div className="flex justify-between text-xs font-semibold text-spotify-gray">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between w-full gap-4">
          {/* Speed Selector */}
          <div className="flex items-center gap-1.5 bg-spotify-light/40 border border-spotify-light/20 px-3 py-1.5 rounded-full text-spotify-gray">
            <Gauge className="w-4 h-4 text-spotify-green" />
            <select
              value={speed}
              onChange={handleSpeedChange}
              className="bg-transparent text-white text-xs font-bold border-none focus:outline-none cursor-pointer"
            >
              <option value="0.5" className="bg-spotify-card text-white">0.5x</option>
              <option value="1.0" className="bg-spotify-card text-white">1x</option>
              <option value="1.25" className="bg-spotify-card text-white">1.25x</option>
              <option value="1.5" className="bg-spotify-card text-white">1.5x</option>
              <option value="2.0" className="bg-spotify-card text-white">2x</option>
            </select>
          </div>

          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            className="bg-spotify-green hover:scale-105 active:scale-95 text-black p-5 rounded-full shadow-lg transition-all"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-black" />
            ) : (
              <Play className="w-6 h-6 fill-black ml-0.5" />
            )}
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="text-spotify-gray hover:text-white transition-all">
              {isMuted ? <VolumeX className="w-5 h-5 text-red-500" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 md:w-24 h-1 bg-spotify-light/60 rounded-lg appearance-none cursor-pointer accent-spotify-green"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayerDetail;
