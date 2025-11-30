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
import groupRoutes from "./groups.routes.js";

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
router.use("/groups", groupRoutes);
router.use("/:quarter/classes", classRoutes);
router.use("/:quarter/classRoles", classRoleRoutes);

export default router;
