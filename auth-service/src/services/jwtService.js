const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token for a user.
 * @param {string} userId - The user's MongoDB _id
 * @returns {string} Signed JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Verify a JWT token.
 * @param {string} token - The JWT token to verify
 * @returns {object} Decoded token payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Set JWT token as an HttpOnly cookie on the response.
 * @param {object} res - Express response object
 * @param {string} token - The JWT token
 */
const setTokenCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false',
    sameSite: process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };

  res.cookie('token', token, cookieOptions);
};

module.exports = { generateToken, verifyToken, setTokenCookie };
