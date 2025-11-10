/**
 * Authentication Middleware
 * 
 * Verifies user authentication and attaches user info to request object.
 * 
 * Current implementation: Query parameter (temporary)
 * TODO: Replace with proper session/JWT authentication
 */

import { ApiError } from '../utils/api-error.js';

/**
 * Middleware to check if user is authenticated
 * Currently checks for userId in query parameters
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const requireAuth = (req, res, next) => {
  try {
    // Get userId from query parameter (temporary approach)
    // TODO: Replace with session/JWT token verification
    const userId = req.query.userId || req.body.userId || req.params.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required. Please provide userId.'
      });
    }

    // Attach userId to request for downstream middleware/controllers
    req.userId = userId;
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware for optional authentication
 * Attaches user info if available, but doesn't require it
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const optionalAuth = (req, res, next) => {
  const userId = req.query.userId || req.body.userId || req.params.userId;
  
  if (userId) {
    req.userId = userId;
  }
  
  next();
};

/**
 * Check if authenticated user has specific role for a resource
 * This should be used after requireAuth middleware
 * 
 * @param {string[]} allowedRoles - Array of allowed roles
 * @returns {Function} Express middleware function
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.userId) {
      throw new ApiError(401, 'Authentication required.');
    }

    // TODO: Fetch user role from database and check against allowedRoles
    // For now, we'll pass through as role checking will be done in service layer
    
    next();
  };
};

