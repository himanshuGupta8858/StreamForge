import axios from 'axios';

/**
 * Axios instance pre-configured for the Music Service API.
 * Uses relative paths (/api) proxying to Nginx/Music Service.
 */
const API = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Playlists
export const createPlaylistAPI = (formData) => API.post('/playlists', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getPlaylistAPI = (id) => API.get(`/playlists/${id}`);
export const getAllPlaylistsAPI = () => API.get('/playlists');

// Songs
export const uploadSongAPI = (formData) => API.post('/songs', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getSongAPI = (id) => API.get(`/songs/${id}`);
export const getAllSongsAPI = () => API.get('/songs');
export const editSongAPI = (id, data) => API.put(`/songs/${id}`, data);
export const deleteSongAPI = (id) => API.delete(`/songs/${id}`);

// Search
export const searchAPI = (query) => API.get(`/search?q=${encodeURIComponent(query)}`);

// Artist Dashboard
export const getArtistDashboardAPI = () => API.get('/artist/dashboard');

// Follow / Unfollow Artists
export const followArtistAPI = (id) => API.post(`/users/artists/${id}/follow`);
export const unfollowArtistAPI = (id) => API.post(`/users/artists/${id}/unfollow`);
export const isFollowingArtistAPI = (id) => API.get(`/users/artists/${id}/is-following`);

export default API;
