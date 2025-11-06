/**
 * Async Handler Utility
 *
 * Wraps async route handlers to properly catch and forward errors
 * to Express error handling middleware.
 */

// code/src/utils/async-handler.js

/**
 * Wraps an async route handler to catch errors and pass them to next()
 *
 * @param {AsyncRequestHandler} fn - The async route handler
 * @returns {RequestHandler} Express request handler
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
