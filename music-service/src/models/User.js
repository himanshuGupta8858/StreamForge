const mongoose = require('mongoose');

// Shared User Schema (points to the 'users' collection populated by auth-service)
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ['USER', 'ARTIST'], default: 'USER', required: true }
  },
  { collection: 'users' } // Explicitly point to the shared collection
);

module.exports = mongoose.model('User', userSchema);
