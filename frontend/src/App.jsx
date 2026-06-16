import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import ArtistDashboard from './pages/ArtistDashboard';
import PlaylistDetail from './pages/Playlist';
import MusicPlayerDetail from './pages/MusicPlayer';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const { user } = useAuth();

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(24, 24, 24, 0.95)',
            color: '#e0e0ff',
            border: '1px solid rgba(29, 185, 84, 0.3)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#1DB954', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#f44336', secondary: '#fff' },
          },
        }}
      />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to={user.role === 'ARTIST' ? '/artist/dashboard' : '/user/dashboard'} replace />
            ) : (
              <Login />
            )
          }
        />
        
        <Route
          path="/signup"
          element={
            user ? (
              <Navigate to={user.role === 'ARTIST' ? '/artist/dashboard' : '/user/dashboard'} replace />
            ) : (
              <Register />
            )
          }
        />

        <Route
          path="/user/dashboard"
          element={
            <ProtectedRoute allowedRoles={['USER']}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/artist/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ARTIST']}>
              <ArtistDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/playlist/:id"
          element={
            <ProtectedRoute>
              <PlaylistDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/music/:id"
          element={
            <ProtectedRoute>
              <MusicPlayerDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            user ? (
              <Navigate to={user.role === 'ARTIST' ? '/artist/dashboard' : '/user/dashboard'} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
