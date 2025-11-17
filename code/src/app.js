/**
 * Express Application with HTMX Support
 *
 * Configures Express app with middleware and routes for HTMX responses
 */

// code/src/app.js

import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { optionalAuth } from "./middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Create and configure Express application for HTMX
 * @returns {Function} Configured Application
 */
export function createApp() {
  const app = express();

  // Serve static files
  app.use(express.static(path.join(__dirname, "public")));

  // Security middleware with HTMX-friendly CSP
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'", // Required for HTMX inline event handlers
            "'unsafe-eval'", // Required for ES6 modules in some browsers
            "https://unpkg.com", // For HTMX CDN
            "https://cdn.jsdelivr.net", // Alternative CDN
          ],
          styleSrc: [
            "'self'", 
            "'unsafe-inline'", // For dynamic styling
            "https://cdnjs.cloudflare.com", // For Font Awesome
          ],
          fontSrc: [
            "'self'", 
            "https://fonts.gstatic.com",
            "https://cdnjs.cloudflare.com", // For Font Awesome fonts
          ],
          connectSrc: [
            "'self'",
            "https://oauth2.googleapis.com",
            "https://www.googleapis.com",
            "https://accounts.google.com",
          ],
          imgSrc: ["'self'", "data:", "blob:", "https:"], // Allow Google profile images
          formAction: ["'self'", "https://accounts.google.com"], // Allow OAuth redirects
        },
      },
      crossOriginEmbedderPolicy: env.NODE_ENV === "production",
    }),
  );

  // CORS configuration for HTMX requests
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "HX-Request",
        "HX-Target",
        "HX-Current-URL",
        "HX-Trigger",
      ],
    }),
  );

  // Rate limiting
  const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    message: `
      <div class="alert alert--error" role="alert">
        <h2>Rate limit exceeded</h2>
        <p>Too many requests from this IP, please try again later.</p>
      </div>
    `,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api", limiter);

  // Cookie parsing
  app.use(cookieParser());

  // Body parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Compression
  app.use(compression());

  // Request logging
  if (env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  } else {
    app.use(morgan("combined"));
  }

  // Set view engine for server-side rendering
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));

  // Health check (returns HTML for HTMX compatibility)
  app.get("/", optionalAuth, (req, res) => {
    const isHtmxRequest = req.headers["hx-request"];

    if (isHtmxRequest) {
      res.send(`
        <div class="health-status">
          <h2>System Status</h2>
          <p>✅ Express + Prisma API is running</p>
          <p>📅 Version: 1.0.0</p>
          <p>🌍 Environment: ${env.NODE_ENV}</p>
        </div>
      `);
    } else {
      res.sendFile(path.join(__dirname, "public", "index.html"));
    }
  });

  // Dashboard route (alias for home)
  app.get("/dashboard", (req, res) => {
    const isHtmxRequest = req.headers["hx-request"];

    if (isHtmxRequest) {
      // Return welcome content for dashboard
      res.send(`
        <section class="welcome" role="region" aria-labelledby="welcome-title">
          <h2 id="welcome-title" class="welcome__title">
            Welcome to Monkey School
          </h2>
          <p class="welcome__description">
            A modern, accessible, and internationalized platform for managing student records.
            Built with HTMX for seamless user interactions and designed with accessibility in mind.
          </p>
        </section>
      `);
    } else {
      res.sendFile(path.join(__dirname, "public", "index.html"));
    }
  });

  // API routes
  app.use("/api", routes);

  // Error handlers (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
