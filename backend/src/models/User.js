const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    role: { type: String, default: 'user' },
    provider: { type: String, default: 'local' },
    createdAt: { type: Date, default: Date.now },
    emailVerificationTokenHash: { type: String },
    emailVerificationTokenExpires: { type: Date },
    resetPasswordTokenHash: { type: String },
    resetPasswordTokenExpires: { type: Date },
    refreshTokenHash: { type: String },
    refreshTokenExpires: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);

