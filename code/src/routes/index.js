/**
 * Routes Index
 *
 * Aggregates and exports all application routes
 */

// code/src/routes/index.js

import { Router } from "express";
import userRoutes from "./user.routes.js";
import classRoutes from "./class.routes.js";
import classRoleRoutes from "./classRole.routes.js";
import authRoutes from "./auth.routes.js";
import activityRoutes from "./activity.routes.js";
import courseSessionRoutes from "./courseSession.routes.js";
import attendanceRoutes from "./attendance.routes.js";
import availabilityRoutes from "./availability.routes.js";
import scheduleRoutes from "./schedule.routes.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import * as classController from "../controllers/class.controller.js";

const router = Router();

/**
 * Mount route modules
 */
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/classes", classRoutes);
router.use("/classRoles", classRoleRoutes);
router.use("/activity", activityRoutes);
router.use("/course-sessions", courseSessionRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/availability", availabilityRoutes);
router.use("/", scheduleRoutes);
router.use("/:quarter/classes", classRoutes);
router.use("/:quarter/classRoles", classRoleRoutes);

// Top-level invite route for joining classes
// URL: /invite/XXXXXXXX
router.get(
  "/invite/:code",
  requireAuth,
  asyncHandler(classController.joinClassByInviteCode)
);

export default router;
