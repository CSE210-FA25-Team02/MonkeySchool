/**
 * Request Validation Middleware - HTMX Edition
 *
 * Validates request body, query, and params using Zod schemas
 * Returns HTML error responses for HTMX compatibility
 */

import { ZodError } from "zod";
import { BadRequestError } from "../utils/api-error.js";
import { createErrorMessage } from "../utils/html-templates.js";

/**
 * Creates a validation middleware for a specific request part
 *
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {'body' | 'query' | 'params'} type - Part of request to validate
 * @returns {import('express').RequestHandler} Express middleware
 */
export function validate(schema, type = "body") {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req[type]);
      req[type] = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const isHtmxRequest = req.headers["hx-request"];

        // Format validation errors for display
        const validationErrors = error.errors.map((err) => {
          const field = err.path.join(".");
          return `${field}: ${err.message}`;
        });

        const errorMessage =
          "Please correct the following errors and try again:";

        if (isHtmxRequest) {
          // Return HTML error for HTMX requests
          const errorHtml = createErrorMessage(errorMessage, validationErrors);
          return res.status(400).send(errorHtml);
        } else {
          // For non-HTMX requests, create a proper API error
          const error = new BadRequestError("Validation failed");
          error.errors = validationErrors;
          return next(error);
        }
      }
      next(error);
    }
  };
}

