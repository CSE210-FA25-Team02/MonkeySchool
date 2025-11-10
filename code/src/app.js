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
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { showRosterPage } from "./frontend/roster.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Create and configure Express application for HTMX
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
            "https://unpkg.com", // For HTMX CDN
            "https://cdn.jsdelivr.net", // Alternative CDN
          ],
          styleSrc: ["'self'", "'unsafe-inline'"], // For dynamic styling
          connectSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "blob:"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
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
  app.get("/", (req, res) => {
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

  // Roster frontend route
  app.get("/roster/:classId", showRosterPage);
  // API routes
  app.use("/api", routes);
  
  // Error handlers (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
