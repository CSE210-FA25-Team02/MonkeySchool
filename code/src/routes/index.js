/**
 * Routes Index
 *
 * Aggregates and exports all application routes
 */

// code/src/routes/index.js

import { Router } from "express";
import studentRoutes from "./student.routes.js";
import userRoutes from "./user.routes.js";
import classRoutes from "./class.routes.js";
import classRoleRoutes from "./classRole.routes.js";
import authRoutes from "./auth.routes.js";

const router = Router();

/**
 * Health check endpoint
 */
router.get("/health", (req, res) => {
  const isHtmxRequest = req.headers["hx-request"];

  const healthData = {
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  };

  if (isHtmxRequest) {
    res.send(`
      <div class="health-status">
        <h2>System Health Check</h2>
        <p>✅ Server: ${healthData.message}</p>
        <p>🕐 Time: ${healthData.timestamp}</p>
      </div>
    `);
  } else {
    res.json(healthData);
  }
});

router.get("/hello", (req, res) => {
  const isHtmxRequest = req.headers["hx-request"];

  if (isHtmxRequest) {
    res.send(`
      <div class="welcome-message">
        <h2>Hello from HTMX!</h2>
        <p>This is a server-generated response that gets swapped into your page.</p>
      </div>
    `);
  } else {
    res.send("Hello from HTMX!");
  }
});

/**
 * Mount route modules
 */
router.use("/auth", authRoutes);
router.use("/students", studentRoutes);
router.use("/users", userRoutes);
router.use("/classes", classRoutes);
router.use("/classRoles", classRoleRoutes);

export default router;
