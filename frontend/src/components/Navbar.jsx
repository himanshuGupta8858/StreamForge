import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Music, LogOut, Menu, X, Disc } from 'lucide-react';

/**
 * Navbar — Spotify-style header navigation.
 */
const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMobileOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    return user.role === 'ARTIST' ? '/artist/dashboard' : '/user/dashboard';
  };

  return (
    <nav className="sticky top-0 z-50 bg-black/95 border-b border-spotify-light/30 backdrop-blur-md px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-spotify-green hover:opacity-90 font-bold text-xl transition-all" onClick={() => setMobileOpen(false)}>
          <Disc className="w-8 h-8 animate-pulse" />
          <span className="text-white tracking-tight">Spotify<span className="text-spotify-green">Service</span></span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-semibold">
          <Link to="/" className="text-spotify-gray hover:text-white transition-all">Home</Link>
          {user ? (
            <>
              <Link to={getDashboardLink()} className="text-spotify-gray hover:text-white transition-all">
                {user.role === 'ARTIST' ? 'Artist Hub' : 'Browse Music'}
              </Link>
              <div className="flex items-center gap-3 border-l border-spotify-light/60 pl-6">
                <span className="bg-spotify-light text-spotify-green text-xs px-2.5 py-1 rounded-full uppercase font-bold tracking-wider">
                  {user.role}
                </span>
                <span className="text-white text-sm">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 bg-transparent hover:bg-spotify-light/30 text-spotify-gray hover:text-white border border-spotify-light/50 px-3.5 py-1.5 rounded-full transition-all text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4 pl-4">
              <Link to="/login" className="text-spotify-gray hover:text-white transition-all">Log in</Link>
              <Link to="/signup" className="bg-white hover:scale-105 text-black px-6 py-2 rounded-full transition-all text-sm font-bold shadow-md">
                Sign Up Free
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-white hover:text-spotify-green transition-all"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-spotify-light/20 flex flex-col gap-3 pb-3 text-sm font-semibold">
          <Link to="/" className="text-spotify-gray hover:text-white py-1 transition-all" onClick={() => setMobileOpen(false)}>
            Home
          </Link>
          {user ? (
            <>
              <Link to={getDashboardLink()} className="text-spotify-gray hover:text-white py-1 transition-all" onClick={() => setMobileOpen(false)}>
                {user.role === 'ARTIST' ? 'Artist Hub' : 'Browse Music'}
              </Link>
              <div className="flex flex-col gap-2 border-t border-spotify-light/20 pt-2">
                <div className="flex items-center justify-between text-xs text-spotify-gray mb-1">
                  <span>Logged in as: <span className="text-white">{user.name}</span></span>
                  <span className="bg-spotify-light text-spotify-green px-2 py-0.5 rounded-full uppercase font-bold scale-90">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 bg-spotify-light text-white py-2 rounded-full hover:bg-spotify-light/80 transition-all text-xs"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2 border-t border-spotify-light/20">
              <Link to="/login" className="text-center text-spotify-gray hover:text-white py-2 transition-all" onClick={() => setMobileOpen(false)}>
                Log in
              </Link>
              <Link to="/signup" className="bg-spotify-green hover:bg-spotify-green/90 text-white text-center py-2.5 rounded-full transition-all" onClick={() => setMobileOpen(false)}>
                Sign Up Free
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
