/**
 * API Error Classes
 *
 * Standardized error classes for consistent error handling across the application
 */

// code/src/utils/api-error.js

/**
 * Base class for API errors
 * @class
 */
export class ApiError extends Error {
  /**
   * Creates an instance of ApiError
   * @param {string} message Error message
   * @param {number} statusCode HTTP status code
   * @param {boolean} [isOperational=true] Whether error is expected and handled
   */
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, ApiError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request
 * @class
 */
export class BadRequestError extends ApiError {
  /**
   * Creates an instance of BadRequestError when client input
   * is malformed or invalid
   * @param {string} [message='Bad Request'] Error message
   */
  constructor(message = "Bad Request") {
    super(message, 400);
  }
}

/**
 * 401 Unauthorized
 * @class
 */
export class UnauthorizedError extends ApiError {
  /**
   * Creates an instance of UnauthorizedError when
   * authentication missing or invalid
   * @param {string} [message='Unauthorized'] Error message
   */
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

/**
 * 403 Forbidden
 * @class
 */
export class ForbiddenError extends ApiError {
  /**
   * Creates an instance of ForbiddenError when
   * user is authenticated but lacks permission
   * @param {string} [message='Forbidden'] Error message
   */
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

/**
 * 404 Not Found
 * @class
 */
export class NotFoundError extends ApiError {
  /**
   * Creates an instance of NotFoundError when
   * resource does not exist
   * @param {string} [message='Resource not found'] Error message
   */
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

/**
 * 409 Conflict
 * @class
 */
export class ConflictError extends ApiError {
  /**
   * Creates an instance of ConflictError when resource
   * already exists or conflicts with current state
   * @param {string} [message='Resource conflict'] Error message
   */
  constructor(message = "Resource conflict") {
    super(message, 409);
  }
}

/**
 * 500 Internal Server Error
 * @class
 */
export class InternalServerError extends ApiError {
  /**
   * Creates an instance of InternalServerError when
   * unexpected issue occurs in server
   * @param {string} [message='Internal server error'] Error message
   */
  constructor(message = "Internal server error") {
    super(message, 500, false);
  }
}

/**
 * 410 Gone (e.g., expired resource)
 * @class GoneError
 */
export class GoneError extends ApiError {
  /**
   * Create a GoneError
   * @param {string} [message="Resource has expired"] - Error message
   */
  constructor(message = "Resource has expired") {
    super(message, 410);
  }
}
