/**
 * API Error Classes
 *
 * Standardized error classes for consistent error handling across the application
 */

// code/src/utils/api-error.js

/**
 * Base class for API errors
 */
export class ApiError extends Error {
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
 */
export class BadRequestError extends ApiError {
  constructor(message = "Bad Request") {
    super(message, 400);
  }
}

/**
 * 400 Bad Request - Input Validation
 */
export class ValidationError extends BadRequestError {
  constructor(message = "Validation failed", field = null, value = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

/**
 * 401 Unauthorized
 */
export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

/**
 * 403 Forbidden
 */
export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

/**
 * 403 Forbidden - Permission Denied
 */
export class PermissionError extends ForbiddenError {
  constructor(message = "Permission denied", requiredPermission = null, userRole = null) {
    super(message);
    this.name = 'PermissionError';
    this.requiredPermission = requiredPermission;
    this.userRole = userRole;
  }
}

/**
 * 404 Not Found
 */
export class NotFoundError extends ApiError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

/**
 * 409 Conflict
 */
export class ConflictError extends ApiError {
  constructor(message = "Resource conflict") {
    super(message, 409);
  }
}

/**
 * 422 Unprocessable Entity - Business Logic Errors
 */
export class BusinessLogicError extends ApiError {
  constructor(message = "Business logic violation", code = null, context = null) {
    super(message, 422);
    this.name = 'BusinessLogicError';
    this.code = code; // e.g., 'LAST_PROFESSOR', 'INVALID_ROLE_CHANGE'
    this.context = context; // Additional context data
  }
}


/**
 * 422 Unprocessable Entity - Specific Business Logic Errors
 */
export class LastProfessorError extends BusinessLogicError {
  constructor(classId) {
    super(
      'Cannot remove or demote the last professor from the class',
      'LAST_PROFESSOR',
      { classId }
    );
  }
}
export class SelfRemovalError extends BusinessLogicError {
  constructor(userId, role) {
    super(
      `${role}s cannot remove themselves from the class`,
      'SELF_REMOVAL_DENIED',
      { userId, role }
    );
  }
}
export class InvalidRoleTransitionError extends BusinessLogicError {
  constructor(fromRole, toRole, reason) {
    super(
      `Cannot change role from ${fromRole} to ${toRole}: ${reason}`,
      'INVALID_ROLE_TRANSITION',
      { fromRole, toRole, reason }
    );
  }
}
export class DuplicateMemberError extends ConflictError {
  constructor(userId, classId, existingRole) {
    super(
      `User is already a member of this class with role: ${existingRole}`
    );
    this.details = { userId, classId, existingRole };
    this.name = 'DuplicateMemberError';
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerError extends ApiError {
  constructor(message = "Internal server error") {
    super(message, 500, false);
  }
}

/**
 * 503 Service Unavailable - Database/External Service Errors
 */
export class ServiceUnavailableError extends ApiError {
  constructor(message = "Service temporarily unavailable", service = null) {
    super(message, 503, false);
    this.name = 'ServiceUnavailableError';
    this.service = service;
  }
}
