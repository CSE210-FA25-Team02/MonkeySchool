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

const router = Router();

/**
 * Mount route modules
 */
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/classes", classRoutes);
router.use("/classRoles", classRoleRoutes);

export default router;
