/**
 * Error Handling Middleware - HTMX Edition
 *
 * Centralized error handler that returns HTML responses for HTMX
 */

import { ApiError } from "../utils/api-error.js";
import { env } from "../config/env.js";
import { Prisma } from "@prisma/client";
import {
  createErrorMessage,
  createBaseLayout,
} from "../utils/html-templates.js";

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(err) {
  switch (err.code) {
    case "P2002":
      return {
        statusCode: 409,
        message: "A record with this information already exists.",
      };
    case "P2025":
      return {
        statusCode: 404,
        message: "The requested record was not found.",
      };
    case "P2003":
      return {
        statusCode: 400,
        message: "Invalid data provided.",
      };
    default:
      return {
        statusCode: 500,
        message: "Database operation failed.",
      };
  }
}

/**
 * Global error handler middleware for HTMX
 */
export function errorHandler(err, req, res, _next) {
  const isHtmxRequest = req.headers["hx-request"];
  let statusCode = 500;
  let message = "An unexpected error occurred.";
  let errors = null;

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaError = handlePrismaError(err);
    statusCode = prismaError.statusCode;
    message = prismaError.message;
  }
  // Handle custom API errors
  else if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  // Handle validation errors
  else if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Please check your input and try again.";
    errors = err.errors;
  }
  // Handle unknown errors
  else {
    console.error("Unhandled error:", err);

    if (env.NODE_ENV === "development") {
      message = err.message;
    } else {
      message = "Internal server error";
    }
  }

  // Check if this is an API request (starts with /api)
  const isApiRequest = req.originalUrl.startsWith("/api");

  // Create HTML error response
  const errorHtml = createErrorMessage(message, errors);

  if (isApiRequest && !isHtmxRequest) {
    // Return JSON for API requests (non-HTMX)
    res.status(statusCode).json({
      success: false,
      error: message,
      ...(errors && { errors }),
    });
  } else if (isHtmxRequest) {
    // Return partial HTML for HTMX requests
    res.status(statusCode).send(errorHtml);
  } else {
    // Return full page for direct navigation
    const fullPage = createBaseLayout(
      `Error ${statusCode} - Student Management System`,
      errorHtml,
      {
        description: "An error occurred while processing your request.",
      }
    );
    res.status(statusCode).send(fullPage);
  }
}

/**
 * 404 Not Found handler for HTMX
 */
export function notFoundHandler(req, res) {
  const isHtmxRequest = req.headers["hx-request"];
  const message = `The page "${req.originalUrl}" was not found.`;

  const errorHtml = `
<section class="empty-state" role="region" aria-labelledby="not-found-title">
    <h2 id="not-found-title" class="empty-state__title">Page Not Found</h2>
    <p class="empty-state__message">
        ${message}
    </p>
    <div class="empty-state__actions">
        <a href="/" 
           class="btn btn--primary"
           hx-get="/"
           hx-target="body"
           hx-push-url="true">
            Go Home
        </a>
        <a href="/api/students" 
           class="btn btn--secondary"
           hx-get="/api/students"
           hx-target="#main-content"
           hx-push-url="true">
            View Students
        </a>
    </div>
</section>`;

  if (isHtmxRequest) {
    res.status(404).send(errorHtml);
  } else {
    const fullPage = createBaseLayout(
      "Page Not Found - Student Management System",
      errorHtml,
      {
        description: "The requested page could not be found.",
      }
    );
    res.status(404).send(fullPage);
  }
}
