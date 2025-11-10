/**
 * Error Handling Middleware - HTMX Edition
 *
 * Centralized error handler that returns HTML responses for HTMX
 */

// code/src/middleware/error-handler.js

import { ApiError } from "../utils/api-error.js";
import { env } from "../config/env.js";
import { Prisma } from "@prisma/client";
import {
  createErrorMessage,
  createBaseLayout,
} from "../utils/html-templates.js";
import path from "path";
import { fileURLToPath } from "url";
import { readFile } from "fs/promises";

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
export function errorHandler(err, req, res) {
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

  // Create HTML error response
  const errorHtml = createErrorMessage(message, errors);

  if (isHtmxRequest) {
    // Return partial HTML for HTMX requests
    res.status(statusCode).send(errorHtml);
  } else {
    // Return full page for direct navigation
    const fullPage = createBaseLayout(
      `Error ${statusCode} - Student Management System`,
      errorHtml,
      {
        description: "An error occurred while processing your request.",
      },
    );
    res.status(statusCode).send(fullPage);
  }
}

/**
 * 404 Not Found handler for HTMX - Shows "Under Construction" page
 */
export async function notFoundHandler(req, res) {
  const isHtmxRequest = req.headers["hx-request"];
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // HTML structure that matches the main content area structure
  // Includes container wrapper to match the layout of other pages
  const errorHtml = `
<div class="container">
    <section class="not-implemented" role="region" aria-labelledby="not-implemented-title">
        <div class="not-implemented__content">
            <h2 id="not-implemented-title" class="not-implemented__title">🚧 This page is not yet available.</h2>
            <p class="not-implemented__message">
                Please check back soon.
            </p>
            <div class="not-implemented__actions">
                <a href="/dashboard" 
                   class="btn btn--primary"
                   ${isHtmxRequest ? `
                     hx-get="/dashboard"
                     hx-target="#main-content"
                     hx-push-url="true"
                   ` : ''}>
                    Go Back to Dashboard
                </a>
            </div>
        </div>
    </section>
</div>`;

  if (isHtmxRequest) {
    // For HTMX requests, return partial HTML immediately (goes into #main-content)
    res.status(404).send(errorHtml);
  } else {
    // For direct navigation, serve the same index.html as home page
    // This ensures the same layout (navbar, header, footer) is used
    try {
      const indexHtmlPath = path.join(__dirname, "..", "public", "index.html");
      const html = await readFile(indexHtmlPath, "utf8");
      
      // Replace the main content with the not-implemented message
      // Find the main-content section and replace everything inside it
      // The main tag structure: <main id="main-content" ...> ... </main>
      const mainTagRegex = /(<main id="main-content"[^>]*>)([\s\S]*?)(<\/main>)/;
      const updatedHtml = html.replace(
        mainTagRegex,
        (match, openingTag, oldContent, closingTag) => {
          // Replace the old content with the error HTML
          return `${openingTag}
        ${errorHtml}
    ${closingTag}`;
        }
      );
      res.status(404).send(updatedHtml);
    } catch (err) {
      console.error("Error reading index.html:", err);
      // Fallback: serve index.html as-is and let client-side handle it
      // Or use a simpler approach - just serve index.html and the URL will trigger client-side 404 handling
      try {
        const indexHtmlPath = path.join(__dirname, "..", "public", "index.html");
        const html = await readFile(indexHtmlPath, "utf8");
        res.status(404).send(html);
      } catch (fallbackErr) {
        console.error("Error serving index.html as fallback:", fallbackErr);
        // Last resort: use base layout
        const fullPage = createBaseLayout(
          "Page Under Construction - Monkey School",
          errorHtml,
          {
            description: "This page is currently under construction.",
          },
        );
        res.status(404).send(fullPage);
      }
    }
  }
}
