/**
 * Dashboard Routes
 *
 * Handles the main dashboard page route
 */

import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

// Dashboard - requires authentication
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res, next) => {
    const { getDashboard } =
      await import("../controllers/dashboard.controller.js");
    return getDashboard(req, res, next);
  })
);

export default router;
