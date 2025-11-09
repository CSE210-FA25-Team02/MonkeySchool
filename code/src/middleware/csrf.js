/**
 * CSRF Protection Middleware
 *
 * Implements CSRF token generation and validation for cookie-based authentication
 * Compatible with HTMX requests using Double Submit Cookie pattern
 */

import { randomBytes } from "crypto";
import { ForbiddenError } from "../utils/api-error.js";
import { env } from "../config/env.js";

/**
 * Generates a CSRF token and sets it in a cookie
 * Middleware that runs on all requests to ensure token is available
 */
export function csrfToken(req, res, next) {
  let token = req.cookies._csrf;

  // Generate new token if not present
  if (!token) {
    token = randomBytes(32).toString("hex");
    res.cookie("_csrf", token, {
      httpOnly: false, // Needs to be readable by JavaScript for HTMX
      secure: env.NODE_ENV === "production",
      sameSite: "strict", // Strict CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: "/", // Available for all paths
    });
  }

  // Make token available to views/controllers
  res.locals.csrfToken = token;
  req.csrfToken = token;

  next();
}

/**
 * Validates CSRF token on state-changing requests
 * Uses Double Submit Cookie pattern for HTMX compatibility
 * Should be applied to POST, PUT, DELETE, PATCH routes
 */
export function validateCsrf(req, res, next) {
  // Skip CSRF validation for safe methods
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Skip CSRF validation in test environment
  // CSRF protection is critical for production but can be disabled in tests
  // for easier test setup. In production, this will always validate.
  if (env.NODE_ENV === "test") {
    return next();
  }

  // Get token from cookie
  const cookieToken = req.cookies._csrf;
  if (!cookieToken) {
    throw new ForbiddenError("CSRF token not found in cookie");
  }

  // Get token from request (check header first, then form body, then query)
  const requestToken =
    req.headers["x-csrf-token"] || req.body?._csrf || req.query?._csrf;

  if (!requestToken) {
    throw new ForbiddenError("CSRF token missing in request");
  }

  // Validate using constant-time comparison to prevent timing attacks
  if (!safeCompare(cookieToken, requestToken)) {
    throw new ForbiddenError("Invalid CSRF token");
  }

  next();
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function safeCompare(a, b) {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}
