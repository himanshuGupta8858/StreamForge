const express = require('express');
const { body } = require('express-validator');
const passport = require('passport');
const {
  signup,
  login,
  logout,
  getMe,
  googleCallback,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// ─── Validation Rules ───────────────────────────────────────────────

const signupValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['USER', 'ARTIST'])
    .withMessage('Role must be either USER or ARTIST'),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// ─── Local Auth Routes ──────────────────────────────────────────────

router.post('/signup', signupValidation, signup);
router.post('/login', loginValidation, login);
router.post('/logout', logout);
router.get('/me', protect, getMe);

// ─── Google OAuth Routes ────────────────────────────────────────────

router.get(
  '/google',
  (req, res, next) => {
    const role = req.query.role || 'USER';
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false,
      state: JSON.stringify({ role }),
    })(req, res, next);
  }
);

router.get(
  '/google/callback',
  (req, res, next) => {
    let role = 'USER';
    try {
      if (req.query.state) {
        const parsed = JSON.parse(req.query.state);
        role = parsed.role || 'USER';
      }
    } catch (e) {
      console.error('Failed to parse Google OAuth state:', e);
    }
    req.authRole = role;

    passport.authenticate('google', {
      session: false,
      failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=oauth_failed`,
    })(req, res, next);
  },
  googleCallback
);

module.exports = router;
