import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { normalizeRole } from '../utils/roles.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');
      if (req.user) {
        req.user.role = normalizeRole(req.user.role);
      }

      return next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, message: 'Not authorized', data: null });
    }
  }

  return res.status(401).json({ success: false, message: 'Not authorized, no token', data: null });
};

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    const normalizedAllowedRoles = roles.map((role) => normalizeRole(role));
    const normalizedUserRole = normalizeRole(req.user.role);
    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      return res.status(403).json({
        success: false,
        message: `User role ${normalizedUserRole} is not authorized to access this route`,
        data: null
      });
    }
    next();
  };
};
