/**
 * Schedule Routes
 * code/src/routes/schedule.routes.js
 */

import { Router } from "express";
import * as scheduleController from "../controllers/schedule.controller.js";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Class schedule page
router.get(
  "/classes/:id/schedule",
  requireAuth,
  asyncHandler(scheduleController.renderClassSchedule),
);

export default router;
