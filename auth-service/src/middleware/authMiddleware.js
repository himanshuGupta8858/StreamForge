const { verifyToken } = require('../services/jwtService');
const User = require('../models/User');

/**
 * Authentication middleware.
 * Extracts JWT from HttpOnly cookie, verifies it,
 * and attaches the user object to req.user.
 */
const protect = async (req, res, next) => {
  try {
    // 1. Get token from cookies
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. No token provided.',
      });
    }

    // 2. Verify token
    const decoded = verifyToken(token);

    // 3. Find user and attach to request
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. User no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Invalid token.',
    });
  }
};

/**
 * Role-based authorization middleware.
 * Restricts access to users with specific roles.
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
      });
    }
    next();
  };
};

module.exports = { protect, restrictTo };
