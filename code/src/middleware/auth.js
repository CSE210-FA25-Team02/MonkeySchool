/**
 * Authentication Middleware
 *
 * Validates JWT tokens and attaches user to request
 */

import { verifyToken } from '../services/auth.service.js';
import { getUserById } from '../services/user.service.js';

/**
 * Middleware to ensure request is authenticated by validating JWT token
 * and attaching the authenticated user to the request object.
 * @param {Object} req Incoming HTTP request
 * @param {Object} res HTTP response object
 * @param {Function} next Next middleware function
 * @returns {Promise<void>}
 */
export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.auth_token;

    if (!token) {
      // Check if this is an API request (has quarter param or Accept: application/json)
      const isApiRequest =
        req.params.quarter ||
        req.path.startsWith('/api') ||
        req.get('Accept')?.includes('application/json');
      if (isApiRequest) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      return res.redirect('/login');
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      const isApiRequest =
        req.params.quarter ||
        req.path.startsWith('/api') ||
        req.get('Accept')?.includes('application/json');
      if (isApiRequest) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      return res.redirect('/login');
    }

    const user = await getUserById(decoded.id);
    if (!user) {
      const isApiRequest =
        req.params.quarter ||
        req.path.startsWith('/api') ||
        req.get('Accept')?.includes('application/json');
      if (isApiRequest) {
        return res.status(401).json({ error: 'User not found' });
      }
      return res.redirect('/login');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    const isApiRequest =
      req.params.quarter ||
      req.path.startsWith('/api') ||
      req.get('Accept')?.includes('application/json');
    if (isApiRequest) {
      return res.status(500).json({ error: 'Authentication error' });
    }
    res.redirect('/login');
  }
}
