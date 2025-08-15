import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    console.log('[authMiddleware] incoming Authorization header:', header || '(none)');

    if (!header) return res.status(401).json({ message: 'Authorization header missing' });

    const parts = header.split(' ');
    const scheme = parts[0];
    const token = parts[1];
    if (!/^Bearer$/i.test(scheme) || !token) {
      console.log('[authMiddleware] malformed header, scheme:', scheme, 'token present:', !!token);
      return res.status(401).json({ message: 'Token missing' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[authMiddleware] jwt payload.sub:', payload?.sub);

    const user = await User.findById(payload.sub).select('-password -passwordHash');
    if (!user) {
      console.log('[authMiddleware] no user for sub');
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[authMiddleware] error:', err.name, err.message);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

export default authMiddleware;