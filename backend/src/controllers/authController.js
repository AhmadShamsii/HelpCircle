import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from './../models/User.js';
import { generateToken, hashToken } from './../utils/token.js';
import { sendEmail } from './../utils/mailer.js';

const SALT_ROUNDS = 12;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

function signJwt(user) {
  return jwt.sign(
    { sub: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ name, email, password: hashedPassword, isVerified: false, });
    await newUser.save();

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const verifyUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

     // DEBUG: log the token & url (safe in dev, remove in prod)
    console.log('[REGISTER] verification token:', token);
    console.log('[REGISTER] verification url:', verifyUrl);

    await sendEmail(
      email,
      "Verify Your Email",
      `<h2>Welcome, ${name}</h2>
       <p>Please verify your email by clicking below:</p>
       <a href="${verifyUrl}" target="_blank">Verify Email</a>`
    );

    res
      .status(201)
      .json({ message: "User registered. Verification email sent." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

export const verifyEmail = async (req, res) => {
 try {
    const token = req.query?.token || req.body?.token;
    if (!token) {
      return res.status(400).json({ message: 'Verification token is missing' });
    }

    console.log('[VERIFY] raw token received (start):', token.slice(0, 50) + (token.length > 50 ? '...' : ''));

    // Show decoded payload without verifying (for debugging)
    try {
      const decoded = jwt.decode(token);
      console.log('[VERIFY] decoded (no-verify) token payload:', decoded);
    } catch (err) {
      console.warn('[VERIFY] decode error (non-fatal):', err);
    }

    if (!process.env.JWT_SECRET) {
      console.error('[VERIFY] JWT_SECRET missing!');
      return res.status(500).json({ message: 'Server misconfiguration' });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error('[VERIFY] jwt.verify error:', err.name, err.message);
      if (err.name === 'TokenExpiredError') {
        return res.status(400).json({ message: 'Verification token has expired.' });
      }
      // Invalid signature / malformed token
      return res.status(400).json({ message: 'Invalid verification token.' });
    }

    console.log('[VERIFY] verified payload:', payload);

    const userId = payload?.userId || payload?.sub;
    if (!userId) {
      return res.status(400).json({ message: 'Invalid verification token (no userId).' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (user.isVerified) return res.json({ message: 'Email already verified.' });

    user.isVerified = true;
    await user.save();

    return res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error('[VERIFY] unexpected error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // normalize email
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // provider guard (if user created via google)
    if (user.provider && user.provider !== 'local') {
      return res.status(400).json({ message: `Please sign in using ${user.provider}` });
    }

    // make sure password field exists
    const storedHash = user.password || user.passwordHash || null;
    if (!storedHash) {
      // This is a developer error: user has no password saved
      console.error('[LOGIN] user has no password hash stored for', user.email);
      return res.status(500).json({ message: 'Server error' });
    }

    const isMatch = await bcrypt.compare(password, storedHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Email is not verified' });
    }

    const token = signJwt(user);

    // Return token and sanitized user object
    return res.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        role: user.role
      }
    });
  } catch (err) {
    console.error('[LOGIN] error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const oauthLogin = async (req, res) => {
  // Called by frontend after Google sign-in (NextAuth) with profile info
  try {
    const { email, name, provider } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        name,
        provider: provider || "google",
        isVerified: true,
      });
    } else {
      // Update provider if necessary
      user.provider = provider || user.provider;
      user.name = user.name || name;
      user.isVerified = true;
      await user.save();
    }

    const token = signJwt(user);
    return res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'User with this email does not exist.' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });

user.resetPasswordTokenHash = hashToken(token);
user.resetPasswordTokenExpires = Date.now() + 15 * 60 * 1000;
await user.save();
console.log(token,"token forgotPassword")
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    await sendEmail(
      email,
      'Password Reset Request',
      `<h2>Hello,</h2>
       <p>Click below to reset your password:</p>
       <a href="${resetUrl}" target="_blank">Reset Password</a>
       <p>This link will expire in 15 minutes.</p>`
    );

    res.status(200).json({ message: 'Password reset email sent.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};


export const resetPassword = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body || {};
    if (!token || !email || !newPassword) return res.status(400).json({ message: 'Missing parameters' });

    const hashed = hashToken(token);
    const user = await User.findOne({
      email: String(email).toLowerCase(),
      resetPasswordTokenHash: hashed,
      resetPasswordTokenExpires: { $gt: Date.now() }
    });
console.log(token,"token resetPassword")

    if (!user) return res.status(400).json({ message: 'Token invalid or expired' });

    const newHash = await bcrypt.hash(newPassword, Number(process.env.SALT_ROUNDS) || 12);
    user.password = newHash;
    user.passwordHash = newHash;
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordTokenExpires = undefined;
    user.passwordChangedAt = new Date();

    await user.save();

    return res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('[RESET] error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
