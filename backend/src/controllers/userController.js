const User = require('../models/User');

exports.getAllUsers = async (req, res) => {
  try {
    // Only admin can see all (example). For now allow any verified user.
    const users = await User.find().select('-passwordHash -resetPasswordTokenHash -emailVerificationTokenHash');
    return res.json({ users });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
