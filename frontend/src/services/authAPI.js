import axios from 'axios';

/**
 * Axios instance pre-configured for the Auth Service API.
 * Uses cookies for authentication (withCredentials).
 */
const API = axios.create({
  baseURL: '/api/auth',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Register a new user.
 * @param {{ name: string, email: string, password: string }} data
 */
export const signupAPI = (data) => API.post('/signup', data);

/**
 * Login user.
 * @param {{ email: string, password: string }} data
 */
export const loginAPI = (data) => API.post('/login', data);

/**
 * Logout user (clears cookie server-side).
 */
export const logoutAPI = () => API.post('/logout');

/**
 * Get current authenticated user.
 */
export const getMeAPI = () => API.get('/me');

/**
 * Get the Google OAuth URL to redirect the user.
 */
export const getGoogleAuthURL = () => {
  return `${window.location.origin}/api/auth/google`;
};

export default API;
