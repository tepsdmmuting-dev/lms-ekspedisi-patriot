const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey_change_me_in_production');
    
    // Add user from payload
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'co_admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};

module.exports = { authMiddleware, adminMiddleware };
