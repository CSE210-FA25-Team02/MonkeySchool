/**
 * Authentication Middleware
 *
 * Validates JWT tokens and attaches user to request
 */

import { verifyToken } from "../services/auth.service.js";
import { getUserById } from "../services/user.service.js";

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
      return res.redirect("/login");
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.redirect("/login");
    }

    const user = await getUserById(decoded.id);
    if (!user) {
      return res.redirect("/login");
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.redirect("/login");
  }
}
