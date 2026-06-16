import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — protects routes based on authentication and roles.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-spotify-dark">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-spotify-green border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect role mismatch to their corresponding dashboard
    return user.role === 'ARTIST'
      ? <Navigate to="/artist/dashboard" replace />
      : <Navigate to="/user/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
