import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Disc } from 'lucide-react';
import { getGoogleAuthURL } from '../../services/authAPI';
import { useState } from 'react';

// Form validation schema using Zod
const schema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [googleRole, setGoogleRole] = useState('USER'); // Role toggle for Google OAuth login

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      const user = await login(data.email, data.password);
      if (user.role === 'ARTIST') {
        navigate('/artist/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    } catch (err) {
      // Error handled by AuthContext toast
    }
  };

  const handleGoogleLogin = () => {
    // Pass the selected role for Google OAuth signup in case it's a new account
    window.location.href = `${getGoogleAuthURL()}?role=${googleRole}`;
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-spotify-dark p-6">
      <div className="w-full max-w-md bg-spotify-card border border-spotify-light/20 p-8 rounded-2xl shadow-xl">
        {/* Brand */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <Disc className="w-12 h-12 text-spotify-green animate-spin" />
          <h2 className="text-2xl font-bold tracking-tight text-white">Log in to Spotify</h2>
          <p className="text-spotify-gray text-sm">Enter your credentials below</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-spotify-gray mb-1">Email address</label>
            <input
              type="email"
              {...register('email')}
              placeholder="name@example.com"
              className="w-full bg-spotify-light/50 border border-spotify-light/40 focus:border-spotify-green rounded-lg px-4 py-2.5 text-white placeholder-spotify-gray focus:outline-none transition-all text-sm"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-spotify-gray mb-1">Password</label>
            <input
              type="password"
              {...register('password')}
              placeholder="Enter password"
              className="w-full bg-spotify-light/50 border border-spotify-light/40 focus:border-spotify-green rounded-lg px-4 py-2.5 text-white placeholder-spotify-gray focus:outline-none transition-all text-sm"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-spotify-green hover:bg-spotify-green/90 hover:scale-[1.01] active:scale-95 text-black font-bold py-3 rounded-full transition-all text-sm mt-2 flex items-center justify-center disabled:opacity-50"
          >
            {isSubmitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-spotify-light/20"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-spotify-card px-2 text-spotify-gray">Or continue with</span>
          </div>
        </div>

        {/* Role toggle for Google OAuth */}
        <div className="flex items-center justify-between mb-4 bg-spotify-light/35 p-3 rounded-xl border border-spotify-light/20">
          <span className="text-xs font-semibold text-spotify-gray">Sign in role (if new account):</span>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setGoogleRole('USER')}
              className={`px-3 py-1 rounded-full font-bold transition-all ${
                googleRole === 'USER' ? 'bg-spotify-green text-black' : 'bg-transparent text-white border border-spotify-light/50'
              }`}
            >
              User
            </button>
            <button
              type="button"
              onClick={() => setGoogleRole('ARTIST')}
              className={`px-3 py-1 rounded-full font-bold transition-all ${
                googleRole === 'ARTIST' ? 'bg-spotify-green text-black' : 'bg-transparent text-white border border-spotify-light/50'
              }`}
            >
              Artist
            </button>
          </div>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-transparent hover:bg-spotify-light/20 border border-spotify-light/50 text-white font-bold py-3 rounded-full transition-all text-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Google OAuth
        </button>

        {/* Footer Link */}
        <p className="text-spotify-gray text-xs text-center mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-white hover:underline hover:text-spotify-green transition-all">
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
