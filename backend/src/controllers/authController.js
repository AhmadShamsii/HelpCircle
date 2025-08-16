const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateToken, hashToken } = require('../utils/token');
const { sendEmail } = require('../utils/mailer');

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 12;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

function signJwt(user) {
  return jwt.sign(
    { sub: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// REGISTER USER AND SEND EMAIL VERIFICATION
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const verifyToken = generateToken();
    const user = await User.create({
      name,
      email: String(email).toLowerCase(),
      password: hash,
      isVerified: false,
      emailVerificationTokenHash: hashToken(verifyToken),
      emailVerificationTokenExpires: new Date(Date.now() + 60 * 60 * 1000),
    });

    const verifyUrl = `${FRONTEND_URL}/auth/verify-email?token=${verifyToken}&email=${encodeURIComponent(user.email)}`;

    await sendEmail(
      user.email,
      'Verify Your Email',
      `<h2>Welcome, ${user.name || ''}</h2><p>Please verify your email by clicking below:</p><a href="${verifyUrl}" target="_blank">Verify Email</a>`
    );

    return res.status(201).json({ message: 'User registered. Verification email sent.' });
  } catch (err) {
    console.error('[REGISTER]', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// VERIFY EMAIL WITH HASHED TOKEN
exports.verifyEmail = async (req, res) => {
  try {
    const token = req.query.token || req.body.token;
    const email = req.query.email || req.body.email;
    if (!token || !email) {
      return res.status(400).json({ message: 'Verification token and email required.' });
    }

    const user = await User.findOne({
      email: String(email).toLowerCase(),
      emailVerificationTokenHash: hashToken(token),
      emailVerificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Token invalid or expired.' });
    }

    user.isVerified = true;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationTokenExpires = undefined;
    await user.save();

    return res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error('[VERIFY]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// LOGIN AND ISSUE TOKENS
exports.login = async (req, res) => {
  try {
    const { email, password, remember } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.provider && user.provider !== 'local') {
      return res.status(400).json({ message: `Please sign in using ${user.provider}` });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Incorrect password' });

    if (!user.isVerified) return res.status(403).json({ message: 'Email is not verified' });

    const token = signJwt(user);
    const refreshToken = generateToken();
    user.refreshTokenHash = hashToken(refreshToken);
    const days = remember ? 30 : 7;
    user.refreshTokenExpires = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await user.save();

    return res.json({
      token,
      refreshToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('[LOGIN]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// OAUTH LOGIN (GOOGLE)
exports.oauthLogin = async (req, res) => {
  try {
    const { email, name, provider } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Email required' });

    let user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      user = await User.create({
        email: String(email).toLowerCase(),
        name,
        provider: provider || 'google',
        isVerified: true,
      });
    } else {
      user.provider = provider || user.provider;
      user.name = user.name || name;
      user.isVerified = true;
      await user.save();
    }

    const token = signJwt(user);
    return res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('[OAUTH]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'User with this email does not exist.' });
    }

    const token = generateToken();
    user.resetPasswordTokenHash = hashToken(token);
    user.resetPasswordTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const resetUrl = `${FRONTEND_URL}/auth/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

    await sendEmail(
      user.email,
      'Password Reset Request',
      `<h2>Hello,</h2><p>Click below to reset your password:</p><a href="${resetUrl}" target="_blank">Reset Password</a><p>This link will expire in 15 minutes.</p>`
    );

    return res.json({ message: 'Password reset email sent.' });
  } catch (err) {
    console.error('[FORGOT]', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body || {};
    if (!token || !email || !newPassword) {
      return res.status(400).json({ message: 'Missing parameters' });
    }

    const user = await User.findOne({
      email: String(email).toLowerCase(),
      resetPasswordTokenHash: hashToken(token),
      resetPasswordTokenExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Token invalid or expired' });

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.password = newHash;
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordTokenExpires = undefined;
    user.passwordChangedAt = new Date();
    await user.save();

    return res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('[RESET]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// REFRESH ACCESS TOKEN
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' });

    const user = await User.findOne({
      refreshTokenHash: hashToken(refreshToken),
      refreshTokenExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(401).json({ message: 'Invalid refresh token' });

    const token = signJwt(user);
    const newRefreshToken = generateToken();
    user.refreshTokenHash = hashToken(newRefreshToken);
    user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await user.save();

    return res.json({ token, refreshToken: newRefreshToken });
  } catch (err) {
    console.error('[REFRESH]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// LOGOUT AND REVOKE REFRESH TOKEN
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (refreshToken) {
      const user = await User.findOne({ refreshTokenHash: hashToken(refreshToken) });
      if (user) {
        user.refreshTokenHash = undefined;
        user.refreshTokenExpires = undefined;
        await user.save();
      }
    }
    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('[LOGOUT]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

