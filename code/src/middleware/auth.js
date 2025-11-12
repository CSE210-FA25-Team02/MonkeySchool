/**
 * Authentication Middleware
 *
 * Validates JWT tokens and attaches user to request
 */

import { verifyToken } from "../services/auth.service.js";
import { getUserById } from "../services/user.service.js";

/**
 * Middleware to require authentication
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
