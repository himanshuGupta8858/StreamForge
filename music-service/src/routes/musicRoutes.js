const express = require('express');
const multer = require('multer');
const musicController = require('../controllers/musicController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// Configure multer memory storage for file buffers
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB limit
  },
});

// ─── Shared Protected Routes ─────────────────────────────────────────
router.get('/playlists', protect, musicController.getAllPlaylists);
router.get('/playlists/:id', protect, musicController.getPlaylist);
router.get('/songs', protect, musicController.getAllSongs);
router.get('/songs/:id', protect, musicController.getSong);
router.get('/search', protect, musicController.search);

// ─── Artist Specific Routes ──────────────────────────────────────────
router.post(
  '/playlists',
  protect,
  restrictTo('ARTIST'),
  upload.single('coverImage'),
  musicController.createPlaylist
);

router.post(
  '/songs',
  protect,
  restrictTo('ARTIST'),
  upload.fields([
    { name: 'audioFile', maxCount: 1 },
    { name: 'coverImageFile', maxCount: 1 }
  ]),
  musicController.uploadSong
);

router.get(
  '/artist/dashboard',
  protect,
  restrictTo('ARTIST'),
  musicController.getArtistDashboard
);

router.put(
  '/songs/:id',
  protect,
  restrictTo('ARTIST'),
  musicController.editSong
);

router.delete(
  '/songs/:id',
  protect,
  restrictTo('ARTIST'),
  musicController.deleteSong
);

// ─── User (Subscriber) Specific Routes ───────────────────────────────
router.post(
  '/users/artists/:id/follow',
  protect,
  restrictTo('USER'),
  musicController.followArtist
);

router.post(
  '/users/artists/:id/unfollow',
  protect,
  restrictTo('USER'),
  musicController.unfollowArtist
);

router.get(
  '/users/artists/:id/is-following',
  protect,
  restrictTo('USER'),
  musicController.checkFollowing
);

module.exports = router;
