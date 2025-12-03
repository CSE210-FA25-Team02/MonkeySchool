/**
 * Express Application with HTMX Support
 *
 * Configures Express app with middleware and routes for HTMX responses
 */

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
import { requireAuth } from "./middleware/auth.js";

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
          // Allow inline event handlers like onclick, onsubmit, etc.
          scriptSrcAttr: ["'unsafe-inline'"],
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
  app.use("/", limiter);

  // Cookie parsing
  app.use(cookieParser());

  // Body parsing
  app.use(
    express.json({
      limit: "10mb",
    }),
  );
  app.use(
    express.urlencoded({
      extended: true,
      limit: "10mb",
    }),
  );

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

  // Dashboard - requires authentication
  app.get("/", requireAuth, async (req, res, next) => {
    const { getDashboard } = await import(
      "./controllers/dashboard.controller.js"
    );
    return getDashboard(req, res, next);
  });

  // Serve login page
  app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
  });

  app.use("/", routes);

  // Attendance page routes (must be before error handlers)
  app.get("/attendance", requireAuth, async (req, res, next) => {
    const { getAttendancePage } = await import(
      "./controllers/attendance.controller.js"
    );
    // getAttendancePage is already wrapped with asyncHandler, so it handles errors
    return getAttendancePage(req, res, next);
  });
  
  // Get new poll form (HTMX)
  app.get(
    "/course/:courseId/session/:sessionId/poll/new",
    requireAuth,
    async (req, res, next) => {
      const { getNewPollForm } = await import(
        "./controllers/attendance.controller.js"
      );
      return getNewPollForm(req, res, next);
    },
  );
  
  // Start poll (HTMX)
  app.post(
    "/course/:courseId/session/:sessionId/poll/start",
    requireAuth,
    async (req, res, next) => {
      const { startPoll } = await import(
        "./controllers/attendance.controller.js"
      );
      return startPoll(req, res, next);
    },
  );
  
  // Session-wise attendance records page (professor only)
  app.get(
    "/course/:courseId/session/:sessionId/records",
    requireAuth,
    async (req, res, next) => {
      const { getSessionRecordsPage } = await import(
        "./controllers/attendance.controller.js"
      );
      return getSessionRecordsPage(req, res, next);
    },
  );
  
  // Legacy route for backward compatibility
  app.get(
    "/attendance/course/session/:sessionId/records",
    requireAuth,
    async (req, res, next) => {
      const { getSessionRecordsPage } = await import(
        "./controllers/attendance.controller.js"
      );
      return getSessionRecordsPage(req, res, next);
    },
  );

  // Course-wise attendance records page (professor only)
  app.get(
    "/course/:courseId/records",
    requireAuth,
    async (req, res, next) => {
      const { getCourseRecordsPage } = await import(
        "./controllers/attendance.controller.js"
      );
      return getCourseRecordsPage(req, res, next);
    },
  );

  // Student attendance records page for a specific course
  app.get(
    "/course/:courseId/user/:userId/records",
    requireAuth,
    async (req, res, next) => {
      const { getStudentCourseRecordsPage } = await import(
        "./controllers/attendance.controller.js"
      );
      return getStudentCourseRecordsPage(req, res, next);
    },
  );

  // API: Get courses for a user (where user is a student)
  app.get(
    "/api/user/:userId/courses",
    requireAuth,
    async (req, res, next) => {
      const { getUserCourses } = await import(
        "./controllers/attendance.controller.js"
      );
      return getUserCourses(req, res, next);
    },
  );

  // API: Get attendance records for a student in a course (JSON)
  app.get(
    "/api/course/:courseId/user/:userId/records",
    requireAuth,
    async (req, res, next) => {
      const { getStudentCourseRecords } = await import(
        "./controllers/attendance.controller.js"
      );
      return getStudentCourseRecords(req, res, next);
    },
  );

  // Legacy route for backward compatibility
  app.get(
    "/attendance/course/:courseId/records",
    requireAuth,
    async (req, res, next) => {
      const { getCourseRecordsPage } = await import(
        "./controllers/attendance.controller.js"
      );
      return getCourseRecordsPage(req, res, next);
    },
  );

  // Redirect /courses/attendance to /attendance for backward compatibility
  app.get("/courses/attendance", requireAuth, async (req, res, next) => {
    const isHtmxRequest = req.headers["hx-request"];
    if (isHtmxRequest) {
      // For HTMX, call the attendance page handler directly
      const { getAttendancePage } = await import(
        "./controllers/attendance.controller.js"
      );
      return getAttendancePage(req, res, next);
    } else {
      // For direct navigation, redirect
      res.redirect("/attendance");
    }
  });

  // Error handlers (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
